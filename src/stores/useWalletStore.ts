import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PeraWalletConnect } from '@perawallet/connect'

let peraWallet: PeraWalletConnect | null = null
try {
  peraWallet = new PeraWalletConnect({
    chainId: 416002, // Algorand Testnet
  })
} catch (error) {
  console.warn('PeraWalletConnect initialization failed:', error)
}

interface WalletState {
  account: string | null
  isConnected: boolean
  isConnecting: boolean
  peraWallet: PeraWalletConnect | null
  setAccount: (account: string | null) => void
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  initialize: () => void
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, _get) => ({
      account: null,
      isConnected: false,
      isConnecting: false,
      peraWallet,

      setAccount: (account) => set({ account, isConnected: !!account }),

      connect: async () => {
        if (!peraWallet) {
          console.error('PeraWallet is not initialized')
          return
        }

        set({ isConnecting: true })
        try {
          const accounts = await peraWallet.connect()
          if (accounts && accounts.length) {
            set({ account: accounts[0], isConnected: true, isConnecting: false })
          } else {
            set({ isConnecting: false })
          }
        } catch (error: any) {
          if (error?.data?.type !== 'CONNECT_MODAL_CLOSED') {
            console.error('Wallet connection error:', error)
          }
          set({ isConnecting: false })
        }
      },

      disconnect: async () => {
        if (!peraWallet) return
        try {
          await peraWallet.disconnect()
          set({ account: null, isConnected: false })
        } catch (error) {
          console.error('Wallet disconnect error:', error)
        }
      },

      initialize: () => {
        if (!peraWallet) return

        // Check if already connected
        peraWallet.reconnectSession().then((accounts) => {
          if (accounts && accounts.length) {
            set({ account: accounts[0], isConnected: true })
          }
        }).catch(() => {
          // Silently fail if no existing session
        })

        // Listen for disconnect
        peraWallet.connector?.on('disconnect', () => {
          set({ account: null, isConnected: false })
        })
      },
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({ account: state.account, isConnected: state.isConnected }),
    }
  )
)

