/// <reference types="vite/client" />
import algosdk from 'algosdk'
import { PeraWalletConnect } from '@perawallet/connect'
import { SERVER_URL } from './constants'

// Algorand configuration
const ALGOD_TOKEN = ''
const ALGOD_SERVER = 'https://testnet-api.algonode.cloud'
const ALGOD_PORT = 443
const INDEXER_SERVER = 'https://testnet-idx.algonode.cloud'
const INDEXER_PORT = 443

// Initialize clients
export const algodClient = new algosdk.Algodv2(
  ALGOD_TOKEN,
  ALGOD_SERVER,
  ALGOD_PORT
)

export const indexerClient = new algosdk.Indexer(
  ALGOD_TOKEN,
  INDEXER_SERVER,
  INDEXER_PORT
)

export interface PinataResponse {
  IpfsHash: string
}

// Upload image — uses Pinata IPFS if JWT is configured, otherwise falls back
// to the local backend server (which serves a short URL safe for Algorand's
// 96-byte assetURL limit).
export const uploadToIPFS = async (file: File): Promise<string> => {
  const pinataJwt = import.meta.env.VITE_PINATA_JWT as string | undefined

  if (pinataJwt) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: { Authorization: `Bearer ${pinataJwt}` },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json() as PinataResponse
    return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`
  }

  // Fallback: upload to the local backend so we get a short URL
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${SERVER_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Image upload to backend failed')
  }

  const data = await response.json() as { url: string }
  return data.url
}

export interface NFTMetadata {
  name: string
  description?: string
  image: string
  properties: {
    royalty: number
  }
}

// Create NFT metadata
export const createNFTMetadata = (
  name: string,
  description: string | undefined,
  imageUrl: string,
  royalty = 0
): NFTMetadata => {
  return {
    name,
    description,
    image: imageUrl,
    properties: {
      royalty: royalty / 100,
    },
  }
}

// Mint NFT as ASA (Algorand Standard Asset)
export const mintNFT = async (
  wallet: string,
  metadataUrl: string,
  name: string,
  unitName = 'NFT'
): Promise<algosdk.Transaction> => {
  try {
    const suggestedParams = await algodClient.getTransactionParams().do()

    // Create NFT ASA (algosdk v3 uses 'sender' instead of 'from')
    const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
      sender: wallet,
      suggestedParams,
      total: 1, // NFTs are always 1-of-1
      decimals: 0,
      defaultFrozen: false,
      manager: wallet,
      reserve: wallet,
      freeze: undefined,
      clawback: undefined,
      unitName: unitName.substring(0, 8), // Max 8 chars
      assetName: name.substring(0, 32), // Max 32 chars
      assetURL: metadataUrl,
      assetMetadataHash: undefined,
    })

    return txn
  } catch (error) {
    console.error('Error creating mint transaction:', error)
    throw error
  }
}

// Transfer NFT
export const transferNFT = async (
  wallet: string,
  assetId: number,
  recipient: string
): Promise<algosdk.Transaction> => {
  try {
    const suggestedParams = await algodClient.getTransactionParams().do()

    // algosdk v3 uses 'sender'/'receiver' instead of 'from'/'to'
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: wallet,
      receiver: recipient,
      amount: 1,
      assetIndex: assetId,
      suggestedParams,
    })

    return txn
  } catch (error) {
    console.error('Error creating transfer transaction:', error)
    throw error
  }
}

// Resale step 1: buyer opts-in to the ASA so they can receive it (skip if already opted in)
export const optInOnly = async (
  peraWallet: PeraWalletConnect,
  buyerAddress: string,
  assetId: number,
): Promise<void> => {
  // Check if buyer already holds the asset slot (e.g. previously owned it)
  try {
    const accountInfo = await algodClient.accountAssetInformation(buyerAddress, assetId).do()
    if (accountInfo['asset-holding'] !== undefined) return // already opted in, nothing to do
  } catch {
    // Never opted in — proceed with opt-in transaction
  }

  const suggestedParams = await algodClient.getTransactionParams().do()
  const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    sender: buyerAddress,
    receiver: buyerAddress,
    amount: 0,
    assetIndex: assetId,
    suggestedParams,
  })

  const signedTxns = await peraWallet.signTransaction([[{ txn: optInTxn, signers: [buyerAddress] }]])
  const { txid } = await algodClient.sendRawTransaction(signedTxns[0]).do()
  await algosdk.waitForConfirmation(algodClient, txid, 4)
}

// Resale step 3: buyer pays the seller after the ASA has been transferred
export const payOnly = async (
  peraWallet: PeraWalletConnect,
  buyerAddress: string,
  sellerAddress: string,
  priceAlgo: number,
): Promise<void> => {
  const suggestedParams = await algodClient.getTransactionParams().do()
  const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: buyerAddress,
    receiver: sellerAddress,
    amount: algoToMicroalgos(priceAlgo),
    suggestedParams,
  })

  const signedTxns = await peraWallet.signTransaction([[{ txn: payTxn, signers: [buyerAddress] }]])
  const { txid } = await algodClient.sendRawTransaction(signedTxns[0]).do()
  await algosdk.waitForConfirmation(algodClient, txid, 4)
}

// Resale: seller transfers the existing ASA to the buyer (seller signs)
export const sendAsset = async (
  peraWallet: PeraWalletConnect,
  sellerAddress: string,
  buyerAddress: string,
  assetId: number,
): Promise<void> => {
  const suggestedParams = await algodClient.getTransactionParams().do()

  const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    sender: sellerAddress,
    receiver: buyerAddress,
    amount: 1,
    assetIndex: assetId,
    suggestedParams,
  })

  const signedTxns = await peraWallet.signTransaction([[{ txn, signers: [sellerAddress] }]])
  const { txid } = await algodClient.sendRawTransaction(signedTxns[0]).do()
  await algosdk.waitForConfirmation(algodClient, txid, 4)
}

// Destroy (delete) an NFT ASA from the blockchain
export const destroyNFT = async (
  wallet: string,
  assetId: number
): Promise<algosdk.Transaction> => {
  try {
    const suggestedParams = await algodClient.getTransactionParams().do()

    const txn = algosdk.makeAssetDestroyTxnWithSuggestedParamsFromObject({
      sender: wallet,
      assetIndex: assetId,
      suggestedParams,
    })

    return txn
  } catch (error) {
    console.error('Error creating destroy transaction:', error)
    throw error
  }
}

// Mint NFT and pay seller atomically in a single group transaction
export const mintAndPay = async (
  peraWallet: PeraWalletConnect,
  buyerAddress: string,
  sellerAddress: string,
  priceAlgo: number,
  nftId: string,
  name: string
): Promise<{ assetId: number }> => {
  // Fetch the marketplace clawback address so resales can be automatic
  const walletRes = await fetch(`${SERVER_URL}/api/wallet/address`)
  const { address: clawbackAddress } = await walletRes.json() as { address: string }

  const suggestedParams = await algodClient.getTransactionParams().do()

  // ARC-3: assetURL points to a JSON metadata file and ends with #arc3
  // so Pera Wallet recognises the ASA as an NFT rather than a generic asset
  const arc3Url = `${SERVER_URL}/api/nfts/${nftId}/metadata#arc3`

  const mintTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    sender: buyerAddress,
    suggestedParams,
    total: 1,
    decimals: 0,
    defaultFrozen: false,
    manager: buyerAddress,
    reserve: buyerAddress,
    freeze: undefined,
    clawback: clawbackAddress, // marketplace can move the NFT on resale without seller approval
    unitName: 'NFT',
    assetName: name.substring(0, 32),
    assetURL: arc3Url,
    assetMetadataHash: undefined,
  })

  const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: buyerAddress,
    receiver: sellerAddress,
    amount: algoToMicroalgos(priceAlgo),
    suggestedParams,
  })

  algosdk.assignGroupID([mintTxn, payTxn])

  const signedTxns = await peraWallet.signTransaction([
    [{ txn: mintTxn, signers: [buyerAddress] }, { txn: payTxn, signers: [buyerAddress] }],
  ])

  const { txid } = await algodClient.sendRawTransaction(signedTxns).do()
  const confirmed = await algosdk.waitForConfirmation(algodClient, txid, 4)

  return { assetId: Number(confirmed.assetIndex) }
}

// Sign and submit a transaction using Pera Wallet, then wait for confirmation
export const signAndSubmitTransaction = async (
  peraWallet: PeraWalletConnect,
  txn: algosdk.Transaction,
  signerAddress: string
): Promise<Awaited<ReturnType<typeof algosdk.waitForConfirmation>>> => {
  // Sign the transaction via Pera Wallet
  const signedTxns = await peraWallet.signTransaction([[{ txn, signers: [signerAddress] }]])

  // signedTxns is an array of Uint8Array; send the first one
  // algosdk v3: sendRawTransaction returns PostTransactionsResponse with .txid (lowercase)
  const result = await algodClient.sendRawTransaction(signedTxns[0]).do()
  const txid: string = result.txid

  // Wait up to 4 rounds for confirmation
  const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txid, 4)

  return confirmedTxn
}

// Format ALGO amount
export const formatAlgo = (microalgos: number): string => {
  return (microalgos / 1000000).toFixed(6)
}

// Convert ALGO to microalgos
export const algoToMicroalgos = (algos: number): number => {
  return Math.round(algos * 1000000)
}
