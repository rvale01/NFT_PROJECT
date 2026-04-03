import { create } from 'zustand'
import { PeraWalletConnect } from '@perawallet/connect'
import { mintAndPay, optInAndPay, sendAsset, destroyNFT, signAndSubmitTransaction } from '../utils/algorand'
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
  assetTransferred?: boolean
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
  getUserNFTs: (account: string | null) => { listed: NFT[]; purchased: NFT[]; sold: NFT[] }
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
    if ('owner' in updates) body.owner = updates.owner ?? null
    if (updates.status !== undefined) body.status = updates.status
    if ('purchasedAt' in updates) body.purchasedAt = updates.purchasedAt ?? null
    if ('assetTransferred' in updates) body.assetTransferred = updates.assetTransferred
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

    if (peraWallet && buyerAddress) {
      if (nft.assetId) {
        // Resale: existing ASA — buyer opts-in and pays seller atomically.
        // The seller must separately transfer the ASA (see sendAsset / "Transfer NFT" in dashboard).
        await optInAndPay(peraWallet, buyerAddress, nft.creator, nft.price, nft.assetId)
      } else {
        // First sale: lazy mint — create the ASA and pay the seller atomically.
        const { assetId: newAssetId } = await mintAndPay(
          peraWallet, buyerAddress, nft.creator, nft.price, nft.id, nft.name,
        )
        await get().updateNFT(id, {
          status: 'minted',
          owner: buyerAddress,
          purchasedAt: new Date().toISOString(),
          assetId: newAssetId,
          assetTransferred: true, // minted directly to buyer, no separate transfer needed
        })
        return true
      }
    }

    await get().updateNFT(id, {
      status: 'minted',
      owner: buyerAddress,
      purchasedAt: new Date().toISOString(),
      assetTransferred: false, // seller still needs to send the ASA
    })

    return true
  },

  getUserNFTs: (account) => {
    if (!account) return { listed: [], purchased: [], sold: [] }
    const nfts = get().nfts
    return {
      listed: nfts.filter((nft) => nft.creator === account && nft.status === 'listed'),
      purchased: nfts.filter((nft) => nft.owner === account && nft.status === 'minted'),
      sold: nfts.filter((nft) => nft.creator === account && nft.status === 'minted'),
    }
  },
}))
