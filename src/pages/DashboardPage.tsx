import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Wallet,
  Plus,
  Package,
  ShoppingBag,
  Trash2,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'
import { useWalletStore } from '../stores/useWalletStore'
import { useNFTStore, NFT } from '../stores/useNFTStore'
import { useToastStore } from '../stores/useToastStore'
import { useI18n } from '../stores/useI18nStore'
import { formatAddress } from '../utils/helpers'
import NFTCard from '../components/NFTCard'
import Button from '../components/Button'
import Modal from '../components/Modal'

type TabType = 'listed' | 'purchased'

const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const account = useWalletStore((state) => state.account)
  const isConnected = useWalletStore((state) => state.isConnected)
  const connect = useWalletStore((state) => state.connect)
  const getUserNFTs = useNFTStore((state) => state.getUserNFTs)
  const deleteNFT = useNFTStore((state) => state.deleteNFT)
  const updateNFT = useNFTStore((state) => state.updateNFT)
  const success = useToastStore((state) => state.success)
  const info = useToastStore((state) => state.info)
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<TabType>('listed')
  const [deleteConfirm, setDeleteConfirm] = useState<NFT | null>(null)

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <div className="max-w-md mx-auto px-4 text-center">
          <Wallet className="mx-auto text-gray-400 mb-4" size={64} />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {t('dashboard.connectWallet')}
          </h2>
          <p className="text-gray-600 mb-6">
            {t('dashboard.connectDescription')}
          </p>
          <Button size="lg" onClick={connect}>
            {t('common.connectWallet')}
          </Button>
        </div>
      </div>
    )
  }

  const { listed, purchased } = getUserNFTs(account)

  const handleDelete = (nft: NFT) => {
    setDeleteConfirm(nft)
  }

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteNFT(deleteConfirm.id)
      success(t('toast.nftDeleted'))
      setDeleteConfirm(null)
    }
  }

  const handleUnlist = (nft: NFT) => {
    updateNFT(nft.id, { status: 'sold' })
    info(t('toast.nftUnlisted'))
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('dashboard.title')}</h1>
          <p className="text-lg text-gray-600">
            {t('dashboard.description')}
          </p>
        </div>

        {/* Wallet Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center text-gray-600 mb-2">
                <Wallet size={20} className="mr-2" />
                <span className="text-sm font-medium">{t('dashboard.connectedWalletLabel')}</span>
              </div>
              <p className="text-lg font-mono text-gray-900">{formatAddress(account)}</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/create')}>
              <Plus size={18} className="mr-2" />
              {t('common.createNFT')}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('listed')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'listed'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Package size={18} className="inline mr-2" />
            {t('dashboard.myListings')} ({listed.length})
          </button>
          <button
            onClick={() => setActiveTab('purchased')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'purchased'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShoppingBag size={18} className="inline mr-2" />
            {t('dashboard.myPurchases')} ({purchased.length})
          </button>
        </div>

        {/* Listed NFTs */}
        {activeTab === 'listed' && (
          <div>
            {listed.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {listed.map((nft) => (
                  <div key={nft.id} className="relative group">
                    <NFTCard nft={nft} />
                    <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleUnlist(nft)}
                        className="bg-yellow-500 text-white p-2 rounded-lg hover:bg-yellow-600 transition-colors shadow-lg"
                        title={t('dashboard.unlist')}
                      >
                        <ExternalLink size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(nft)}
                        className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                        title={t('common.delete')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
                <Package className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {t('dashboard.noListings')}
                </h3>
                <p className="text-gray-600 mb-6">
                  {t('dashboard.noListingsDesc')}
                </p>
                <Button onClick={() => navigate('/create')}>
                  {t('dashboard.createFirst')}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Purchased NFTs */}
        {activeTab === 'purchased' && (
          <div>
            {purchased.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {purchased.map((nft) => (
                  <NFTCard key={nft.id} nft={nft} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
                <ShoppingBag className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {t('dashboard.noPurchases')}
                </h3>
                <p className="text-gray-600 mb-6">
                  {t('dashboard.noPurchasesDesc')}
                </p>
                <Button onClick={() => navigate('/marketplace')}>
                  {t('dashboard.explore')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={t('dashboard.deleteConfirm.title')}
      >
        <div className="space-y-4">
          <div className="flex items-start bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <AlertCircle className="text-yellow-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-yellow-900">
              {t('dashboard.deleteConfirm.message')}
            </p>
          </div>
          {deleteConfirm && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-semibold text-gray-900 mb-1">{deleteConfirm.name}</p>
              <p className="text-sm text-gray-600">{deleteConfirm.price} ALGO</p>
            </div>
          )}
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteConfirm(null)}
            >
              {t('dashboard.deleteConfirm.cancel')}
            </Button>
            <Button
              variant="primary"
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={confirmDelete}
            >
              {t('dashboard.deleteConfirm.confirm')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default DashboardPage
