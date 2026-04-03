export const APP_NAME = 'AlgoNFT Marketplace'

export interface NetworkInfo {
  name: string
  fee: number
  currency: string
}

export const NETWORK_INFO: NetworkInfo = {
  name: 'Algorand Testnet',
  fee: 0.001, // Estimated fee in ALGO
  currency: 'ALGO',
}

export const NFT_STATUS = {
  LISTED: 'listed',
  SOLD: 'sold',
  MINTED: 'minted',
} as const
