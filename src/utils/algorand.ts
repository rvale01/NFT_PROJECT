/// <reference types="vite/client" />
import algosdk from 'algosdk'
import { PeraWalletConnect } from '@perawallet/connect'

// Algorand configuration
const ALGOD_TOKEN = ''
const ALGOD_SERVER = 'https://mainnet-api.algonode.cloud'
const ALGOD_PORT = 443
const INDEXER_SERVER = 'https://mainnet-idx.algonode.cloud'
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

// Helper to upload image to IPFS via Pinata pinning service.
// Requires VITE_PINATA_JWT to be set in the environment. If the token is not
// configured the function falls back to returning a local data URL so the app
// remains usable during development without credentials.
export const uploadToIPFS = async (file: File): Promise<string> => {
  const pinataJwt = import.meta.env.VITE_PINATA_JWT as string | undefined

  if (pinataJwt) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pinataJwt}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json() as PinataResponse
    return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`
  }

  // Fallback: return a data URL when no Pinata JWT is configured
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      resolve(reader.result as string)
    }
    reader.readAsDataURL(file)
  })
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
