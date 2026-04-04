import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import algosdk from 'algosdk'
import db from './db.js'
import { clawbackAddress, clawbackSk } from './wallet.js'

const ALGOD_SERVER = 'https://testnet-api.algonode.cloud'
const algodClient = new algosdk.Algodv2('', ALGOD_SERVER, 443)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir)

const app = express()
const PORT = 3001

app.use(cors({ origin: 'http://localhost:3000' }))
app.use(express.json())
app.use('/uploads', express.static(uploadsDir))

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
})
const upload = multer({ storage })

// POST /api/upload — upload an image, returns { url }
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  const publicUrl = process.env.SERVER_PUBLIC_URL ?? `http://localhost:${PORT}`
  res.json({ url: `${publicUrl}/uploads/${req.file.filename}` })
})

// Map DB row (snake_case) to API response (camelCase)
function rowToNFT(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    royalty: row.royalty,
    imageUrl: row.image_url,
    creator: row.creator,
    owner: row.owner,
    status: row.status,
    createdAt: row.created_at,
    purchasedAt: row.purchased_at,
    assetId: row.asset_id,
    assetTransferred: row.asset_transferred === 1,
  }
}

// GET /api/wallet/address — returns the marketplace clawback address
app.get('/api/wallet/address', (_req, res) => {
  res.json({ address: clawbackAddress })
})

// POST /api/nfts/:id/transfer — clawback transfer from seller to buyer (signed by marketplace wallet)
app.post('/api/nfts/:id/transfer', async (req, res) => {
  try {
    const nft = db.prepare('SELECT * FROM nfts WHERE id = ?').get(req.params.id)
    if (!nft) return res.status(404).json({ error: 'NFT not found' })
    if (!nft.asset_id) return res.status(400).json({ error: 'NFT has no on-chain asset' })
    if (!nft.owner) return res.status(400).json({ error: 'NFT has no buyer recorded' })

    console.log(`[transfer] assetId=${nft.asset_id} from=${nft.creator} to=${nft.owner} clawback=${clawbackAddress}`)

    // Check clawback wallet balance
    const accountInfo = await algodClient.accountInformation(clawbackAddress).do()
    const balance = Number(accountInfo.amount)
    console.log(`[transfer] clawback wallet balance: ${balance} microALGO`)
    if (balance < 1000) {
      return res.status(500).json({
        error: `Clawback wallet has insufficient funds (${balance} microALGO). Fund this address with testnet ALGO: ${clawbackAddress}`
      })
    }

    const suggestedParams = await algodClient.getTransactionParams().do()

    // Clawback: move asset from seller (creator) to buyer (owner)
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: clawbackAddress,
      receiver: nft.owner,
      assetSender: nft.creator, // clawback from seller
      amount: 1,
      assetIndex: nft.asset_id,
      suggestedParams,
    })

    const signedTxn = txn.signTxn(clawbackSk)
    const { txid } = await algodClient.sendRawTransaction(signedTxn).do()
    await algosdk.waitForConfirmation(algodClient, txid, 4)

    db.prepare('UPDATE nfts SET asset_transferred = 1 WHERE id = ?').run(req.params.id)
    res.json({ success: true, txid })
  } catch (err) {
    console.error('Clawback transfer error:', err)
    res.status(500).json({ error: 'Transfer failed' })
  }
})

// GET /api/nfts/:id/metadata — ARC-3 metadata so Pera Wallet recognises the ASA as an NFT
app.get('/api/nfts/:id/metadata', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM nfts WHERE id = ?').get(req.params.id)
    if (!row) return res.status(404).json({ error: 'NFT not found' })

    res.json({
      name: row.name,
      description: row.description ?? '',
      image: row.image_url,
      image_mimetype: row.image_url?.match(/\.(png)$/i) ? 'image/png' : 'image/jpeg',
      properties: {
        royalty: row.royalty ? row.royalty / 100 : 0,
        creator: row.creator,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch metadata' })
  }
})

// GET /api/nfts — return all NFTs, optionally filter by ?status=listed
app.get('/api/nfts', (req, res) => {
  try {
    const { status } = req.query
    let rows
    if (status) {
      rows = db.prepare('SELECT * FROM nfts WHERE status = ? ORDER BY created_at DESC').all(status)
    } else {
      rows = db.prepare('SELECT * FROM nfts ORDER BY created_at DESC').all()
    }
    res.json(rows.map(rowToNFT))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch NFTs' })
  }
})

// GET /api/nfts/:id — return single NFT
app.get('/api/nfts/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM nfts WHERE id = ?').get(req.params.id)
    if (!row) return res.status(404).json({ error: 'NFT not found' })
    res.json(rowToNFT(row))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch NFT' })
  }
})

// POST /api/nfts — create a new NFT listing
app.post('/api/nfts', (req, res) => {
  try {
    const { name, description, price, royalty, imageUrl, creator } = req.body
    if (!name || !imageUrl || !creator || price == null) {
      return res.status(400).json({ error: 'Missing required fields: name, imageUrl, creator, price' })
    }

    const id = Date.now().toString()
    const createdAt = new Date().toISOString()

    db.prepare(`
      INSERT INTO nfts (id, name, description, price, royalty, image_url, creator, owner, status, created_at, purchased_at, asset_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 'listed', ?, NULL, NULL)
    `).run(id, name, description ?? null, price, royalty ?? null, imageUrl, creator, createdAt)

    const row = db.prepare('SELECT * FROM nfts WHERE id = ?').get(id)
    res.status(201).json(rowToNFT(row))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create NFT' })
  }
})

// PATCH /api/nfts/:id — update an NFT
app.patch('/api/nfts/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM nfts WHERE id = ?').get(req.params.id)
    if (!existing) return res.status(404).json({ error: 'NFT not found' })

    const { name, description, price, royalty, imageUrl, creator, owner, status, purchasedAt, assetId, assetTransferred } = req.body

    const updated = {
      name: name ?? existing.name,
      description: description !== undefined ? description : existing.description,
      price: price ?? existing.price,
      royalty: royalty !== undefined ? royalty : existing.royalty,
      image_url: imageUrl ?? existing.image_url,
      creator: creator ?? existing.creator,
      owner: owner !== undefined ? owner : existing.owner,
      status: status ?? existing.status,
      purchased_at: purchasedAt !== undefined ? purchasedAt : existing.purchased_at,
      asset_id: assetId !== undefined ? assetId : existing.asset_id,
      asset_transferred: assetTransferred !== undefined ? (assetTransferred ? 1 : 0) : existing.asset_transferred,
    }

    db.prepare(`
      UPDATE nfts SET
        name = ?, description = ?, price = ?, royalty = ?, image_url = ?,
        creator = ?, owner = ?, status = ?, purchased_at = ?, asset_id = ?, asset_transferred = ?
      WHERE id = ?
    `).run(
      updated.name, updated.description, updated.price, updated.royalty, updated.image_url,
      updated.creator, updated.owner, updated.status, updated.purchased_at, updated.asset_id, updated.asset_transferred,
      req.params.id
    )

    const row = db.prepare('SELECT * FROM nfts WHERE id = ?').get(req.params.id)
    res.json(rowToNFT(row))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update NFT' })
  }
})

// DELETE /api/nfts/:id — delete an NFT
app.delete('/api/nfts/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM nfts WHERE id = ?').get(req.params.id)
    if (!existing) return res.status(404).json({ error: 'NFT not found' })

    db.prepare('DELETE FROM nfts WHERE id = ?').run(req.params.id)
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete NFT' })
  }
})

app.listen(PORT, () => {
  console.log(`NFT Marketplace API running on http://localhost:${PORT}`)
})
