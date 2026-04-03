import { create } from 'zustand'
import { PeraWalletConnect } from '@perawallet/connect'
import { mintAndPay, destroyNFT, signAndSubmitTransaction } from '../utils/algorand'
import { API_URL } from '../utils/constants'

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
  fetchNFTs: () => Promise<void>
  createNFT: (nftData: CreateNFTData, peraWallet?: PeraWalletConnect | null) => Promise<NFT>
  updateNFT: (id: string, updates: Partial<NFT>) => Promise<void>
  deleteNFT: (id: string, peraWallet?: PeraWalletConnect | null) => Promise<void>
  buyNFT: (id: string, buyerAddress: string, peraWallet?: PeraWalletConnect | null) => Promise<boolean>
  getUserNFTs: (account: string | null) => { listed: NFT[]; purchased: NFT[] }
}

export const useNFTStore = create<NFTState>()((set, get) => ({
  nfts: [],

  // No-op: data is loaded via fetchNFTs()
  initialize: () => {},

  fetchNFTs: async () => {
    const res = await fetch(`${API_URL}/nfts`)
    if (!res.ok) throw new Error('Failed to fetch NFTs')
    const data: NFT[] = await res.json()
    set({ nfts: data })
  },

  createNFT: async (nftData, _peraWallet) => {
    // Lazy minting: no on-chain transaction at creation time.
    // The NFT is stored off-chain until a buyer purchases it,
    // at which point the ASA is minted and the buyer pays the fee.
    const res = await fetch(`${API_URL}/nfts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nftData),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to create NFT')
    }
    const newNFT: NFT = await res.json()
    set((state) => ({ nfts: [newNFT, ...state.nfts] }))
    return newNFT
  },

  updateNFT: async (id, updates) => {
    // Map camelCase fields to the shape expected by the API
    const body: Record<string, unknown> = {}
    if (updates.name !== undefined) body.name = updates.name
    if (updates.description !== undefined) body.description = updates.description
    if (updates.price !== undefined) body.price = updates.price
    if (updates.royalty !== undefined) body.royalty = updates.royalty
    if (updates.imageUrl !== undefined) body.imageUrl = updates.imageUrl
    if (updates.creator !== undefined) body.creator = updates.creator
    if (updates.owner !== undefined) body.owner = updates.owner
    if (updates.status !== undefined) body.status = updates.status
    if (updates.purchasedAt !== undefined) body.purchasedAt = updates.purchasedAt
    if (updates.assetId !== undefined) body.assetId = updates.assetId

    const res = await fetch(`${API_URL}/nfts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to update NFT')
    }
    const updatedNFT: NFT = await res.json()
    set((state) => ({
      nfts: state.nfts.map((nft) => (nft.id === id ? updatedNFT : nft)),
    }))
  },

  deleteNFT: async (id, peraWallet) => {
    const nft = get().nfts.find((n) => n.id === id)
    if (!nft) return

    // Attempt real on-chain destroy if wallet and assetId are available
    if (peraWallet && nft.assetId && nft.creator) {
      try {
        const txn = await destroyNFT(nft.creator, nft.assetId)
        await signAndSubmitTransaction(peraWallet, txn, nft.creator)
      } catch (err) {
        // Blockchain submission failed — surface it so the caller can show a toast
        throw err
      }
    }

    const res = await fetch(`${API_URL}/nfts/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to delete NFT')
    }
    set((state) => ({
      nfts: state.nfts.filter((n) => n.id !== id),
    }))
  },

  buyNFT: async (id, buyerAddress, peraWallet) => {
    const nft = get().nfts.find((n) => n.id === id)
    if (!nft) return false

    // Lazy minting: mint the ASA and pay the seller atomically in one group tx.
    let assetId: number | undefined
    if (peraWallet && buyerAddress) {
      const { assetId: id } = await mintAndPay(
        peraWallet,
        buyerAddress,
        nft.creator,
        nft.price,
        nft.id,
        nft.name,
      )
      assetId = id
    }

    await get().updateNFT(id, {
      status: 'minted',
      owner: buyerAddress,
      purchasedAt: new Date().toISOString(),
      ...(assetId !== undefined && { assetId }),
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
}))
