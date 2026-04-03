import algosdk from 'algosdk'

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

// Helper to upload image to IPFS (placeholder - in production use actual IPFS service)
export const uploadToIPFS = async (file) => {
  // In production, you would upload to IPFS here
  // For now, we'll use a data URL as placeholder
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      // Return a placeholder URL - in production this would be an IPFS hash
      resolve(reader.result) // This is a data URL, replace with IPFS hash in production
    }
    reader.readAsDataURL(file)
  })
}

// Create NFT metadata
export const createNFTMetadata = (name, description, imageUrl, royalty = 0) => {
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
export const mintNFT = async (wallet, metadataUrl, name, unitName = 'NFT') => {
  try {
    const suggestedParams = await algodClient.getTransactionParams().do()

    // Create NFT ASA
    const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
      from: wallet,
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
export const transferNFT = async (wallet, assetId, recipient) => {
  try {
    const suggestedParams = await algodClient.getTransactionParams().do()

    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: wallet,
      to: recipient,
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

// Format ALGO amount
export const formatAlgo = (microalgos) => {
  return (microalgos / 1000000).toFixed(6)
}

// Convert ALGO to microalgos
export const algoToMicroalgos = (algos) => {
  return Math.round(algos * 1000000)
}


