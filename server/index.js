import express from 'express'
import cors from 'cors'
import db from './db.js'

const app = express()
const PORT = 3001

app.use(cors({ origin: 'http://localhost:3000' }))
app.use(express.json())

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
  }
}

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

    const { name, description, price, royalty, imageUrl, creator, owner, status, purchasedAt, assetId } = req.body

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
    }

    db.prepare(`
      UPDATE nfts SET
        name = ?, description = ?, price = ?, royalty = ?, image_url = ?,
        creator = ?, owner = ?, status = ?, purchased_at = ?, asset_id = ?
      WHERE id = ?
    `).run(
      updated.name, updated.description, updated.price, updated.royalty, updated.image_url,
      updated.creator, updated.owner, updated.status, updated.purchased_at, updated.asset_id,
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
