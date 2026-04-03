export const APP_NAME = 'AlgoNFT Marketplace'

const SERVER_URL = (import.meta.env.VITE_SERVER_URL as string | undefined) ?? 'http://localhost:3001'

export const API_URL = `${SERVER_URL}/api`
export { SERVER_URL }

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
