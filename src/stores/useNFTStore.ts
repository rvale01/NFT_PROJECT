import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PeraWalletConnect } from '@perawallet/connect'
import { mintNFT, transferNFT, signAndSubmitTransaction } from '../utils/algorand'

export type NFTStatus = 'listed' | 'sold' | 'minted'

export interface NFT {
  id: string
  name: string
  description?: string
  price: number
  royalty?: number
  imageUrl: string
  creator: string
  owner?: string
  status: NFTStatus
  createdAt: string
  purchasedAt?: string
  assetId?: number
}

interface CreateNFTData {
  name: string
  description?: string
  price: number
  royalty?: number
  imageUrl: string
  creator: string
}

interface NFTState {
  nfts: NFT[]
  initialize: () => void
  createNFT: (nftData: CreateNFTData, peraWallet?: PeraWalletConnect | null) => Promise<NFT>
  updateNFT: (id: string, updates: Partial<NFT>) => void
  deleteNFT: (id: string) => void
  buyNFT: (id: string, buyerAddress: string, peraWallet?: PeraWalletConnect | null) => Promise<boolean>
  getUserNFTs: (account: string | null) => { listed: NFT[]; purchased: NFT[] }
}

export const useNFTStore = create<NFTState>()(
  persist(
    (set, get) => ({
      nfts: [],

      // Load NFTs from storage (handled by persist middleware)
      initialize: () => {
        // NFTs are automatically loaded from localStorage by persist middleware
      },

      createNFT: async (nftData, peraWallet) => {
        const newNFT: NFT = {
          id: Date.now().toString(),
          ...nftData,
          status: 'listed',
          createdAt: new Date().toISOString(),
        }

        // Attempt real on-chain mint if wallet is available
        if (peraWallet && nftData.creator) {
          try {
            const txn = await mintNFT(nftData.creator, nftData.imageUrl, nftData.name)
            const confirmedTxn = await signAndSubmitTransaction(peraWallet, txn, nftData.creator)
            // The confirmed transaction includes the created asset index
            const assetId: number = confirmedTxn['asset-index'] ?? confirmedTxn.assetIndex
            newNFT.assetId = assetId
          } catch (err) {
            // Blockchain submission failed — surface it so the caller can show a toast
            throw err
          }
        }

        set((state) => ({ nfts: [newNFT, ...state.nfts] }))
        return newNFT
      },

      updateNFT: (id, updates) => {
        set((state) => ({
          nfts: state.nfts.map((nft) => (nft.id === id ? { ...nft, ...updates } : nft)),
        }))
      },

      deleteNFT: (id) => {
        set((state) => ({
          nfts: state.nfts.filter((nft) => nft.id !== id),
        }))
      },

      buyNFT: async (id, buyerAddress, peraWallet) => {
        const nft = get().nfts.find((n) => n.id === id)
        if (!nft) return false

        // Attempt real on-chain transfer if wallet and assetId are available
        if (peraWallet && nft.assetId && nft.creator) {
          try {
            const txn = await transferNFT(nft.creator, nft.assetId, buyerAddress)
            await signAndSubmitTransaction(peraWallet, txn, nft.creator)
          } catch (err) {
            // Blockchain submission failed — surface it so the caller can show a toast
            throw err
          }
        }

        get().updateNFT(id, {
          status: 'minted',
          owner: buyerAddress,
          purchasedAt: new Date().toISOString(),
        })

        return true
      },

      getUserNFTs: (account) => {
        if (!account) return { listed: [], purchased: [] }
        const nfts = get().nfts
        return {
          listed: nfts.filter((nft) => nft.creator === account && nft.status === 'listed'),
          purchased: nfts.filter((nft) => nft.owner === account && nft.status === 'minted'),
        }
      },
    }),
    {
      name: 'nft-storage',
    }
  )
)
