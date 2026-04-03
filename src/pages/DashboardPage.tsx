import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Wallet,
  Plus,
  Package,
  ShoppingBag,
  Tag,
  Trash2,
  ExternalLink,
  AlertCircle,
  Send,
} from 'lucide-react'
import { useWalletStore } from '../stores/useWalletStore'
import { useNFTStore, NFT } from '../stores/useNFTStore'
import { useToastStore } from '../stores/useToastStore'
import { useI18n } from '../stores/useI18nStore'
import { formatAddress } from '../utils/helpers'
import { sendAsset } from '../utils/algorand'
import NFTCard from '../components/NFTCard'
import Button from '../components/Button'
import Modal from '../components/Modal'

type TabType = 'listed' | 'purchased' | 'sold'

const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const account = useWalletStore((state) => state.account)
  const isConnected = useWalletStore((state) => state.isConnected)
  const connect = useWalletStore((state) => state.connect)
  const peraWallet = useWalletStore((state) => state.peraWallet)
  const getUserNFTs = useNFTStore((state) => state.getUserNFTs)
  const deleteNFT = useNFTStore((state) => state.deleteNFT)
  const updateNFT = useNFTStore((state) => state.updateNFT)
  const success = useToastStore((state) => state.success)
  const error = useToastStore((state) => state.error)
  const info = useToastStore((state) => state.info)
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<TabType>('listed')
  const [deleteConfirm, setDeleteConfirm] = useState<NFT | null>(null)
  const [relistNFT, setRelistNFT] = useState<NFT | null>(null)
  const [relistPrice, setRelistPrice] = useState('')
  const [isRelisting, setIsRelisting] = useState(false)
  const [isSendingAsset, setIsSendingAsset] = useState<string | null>(null)

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

  const { listed, purchased, sold } = getUserNFTs(account)

  const handleDelete = (nft: NFT) => {
    setDeleteConfirm(nft)
  }

  const confirmDelete = async () => {
    if (deleteConfirm) {
      try {
        await deleteNFT(deleteConfirm.id, peraWallet)
        success(t('dashboard.deleteSuccess'))
        setDeleteConfirm(null)
      } catch (err) {
        error(t('dashboard.deleteFailed'))
      }
    }
  }

  const handleUnlist = (nft: NFT) => {
    updateNFT(nft.id, { status: 'sold' })
    info(t('toast.nftUnlisted'))
  }

  const handleRelistOpen = (nft: NFT) => {
    setRelistNFT(nft)
    setRelistPrice(String(nft.price))
  }

  const handleRelistConfirm = async () => {
    if (!relistNFT || !account) return
    const price = parseFloat(relistPrice)
    if (!price || price <= 0) return
    setIsRelisting(true)
    try {
      await updateNFT(relistNFT.id, {
        status: 'listed',
        creator: account,
        owner: undefined,
        price,
        purchasedAt: undefined,
      })
      success(t('dashboard.relistSuccess'))
      setRelistNFT(null)
      setRelistPrice('')
    } catch {
      error(t('dashboard.relistFailed'))
    } finally {
      setIsRelisting(false)
    }
  }

  const handleSendAsset = async (nft: NFT) => {
    if (!account || !peraWallet || !nft.assetId || !nft.owner) return
    setIsSendingAsset(nft.id)
    try {
      await sendAsset(peraWallet, account, nft.owner, nft.assetId)
      await updateNFT(nft.id, { assetTransferred: true })
      success(t('dashboard.assetSentSuccess'))
    } catch {
      error(t('dashboard.assetSentFailed'))
    } finally {
      setIsSendingAsset(null)
    }
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

        {/* Pending transfer banner */}
        {sold.some((nft) => !nft.assetTransferred && nft.assetId) && (
          <div className="bg-orange-50 border border-orange-300 rounded-2xl p-5 mb-8 flex items-start gap-4">
            <AlertCircle className="text-orange-500 flex-shrink-0 mt-0.5" size={22} />
            <div className="flex-1">
              <p className="font-semibold text-orange-900 mb-1">{t('dashboard.pendingTransferTitle')}</p>
              <p className="text-sm text-orange-800 mb-3">{t('dashboard.pendingTransferDesc')}</p>
              <div className="flex flex-col gap-2">
                {sold.filter((nft) => !nft.assetTransferred && nft.assetId).map((nft) => (
                  <div key={nft.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-orange-200">
                    <span className="font-medium text-gray-900 text-sm">{nft.name}</span>
                    <button
                      onClick={() => handleSendAsset(nft)}
                      disabled={isSendingAsset === nft.id}
                      className="flex items-center gap-2 bg-orange-500 text-white py-1.5 px-4 rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      <Send size={14} />
                      {isSendingAsset === nft.id ? t('common.loading') : t('dashboard.transferNFT')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
          <button
            onClick={() => setActiveTab('sold')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'sold'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Tag size={18} className="inline mr-2" />
            {t('dashboard.mySales')} ({sold.length})
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
                  <div key={nft.id} className="relative group">
                    <NFTCard nft={nft} />
                    <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleRelistOpen(nft)}
                        className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 transition-colors shadow-lg"
                        title={t('dashboard.listForSale')}
                      >
                        <Tag size={16} />
                      </button>
                    </div>
                  </div>
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

      {/* Sold NFTs */}
        {activeTab === 'sold' && (
          <div>
            {sold.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sold.map((nft) => (
                  <div key={nft.id} className="relative group">
                    <NFTCard nft={nft} />
                    {!nft.assetTransferred && nft.assetId && (
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-100">
                        <button
                          onClick={() => handleSendAsset(nft)}
                          disabled={isSendingAsset === nft.id}
                          className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-2 px-3 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                          <Send size={14} />
                          {isSendingAsset === nft.id ? t('common.loading') : t('dashboard.transferNFT')}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
                <Tag className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {t('dashboard.noSales')}
                </h3>
                <p className="text-gray-600">
                  {t('dashboard.noSalesDesc')}
                </p>
              </div>
            )}
          </div>
        )}

      {/* Relist Modal */}
      <Modal
        isOpen={!!relistNFT}
        onClose={() => { setRelistNFT(null); setRelistPrice('') }}
        title={t('dashboard.relistTitle')}
      >
        <div className="space-y-4">
          <p className="text-gray-600">{t('dashboard.relistDescription')}</p>
          {relistNFT && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-semibold text-gray-900">{relistNFT.name}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('dashboard.relistPrice')}
            </label>
            <input
              type="number"
              value={relistPrice}
              onChange={(e) => setRelistPrice(e.target.value)}
              step="0.1"
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="10"
            />
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1" onClick={() => { setRelistNFT(null); setRelistPrice('') }}>
              {t('common.cancel')}
            </Button>
            <Button className="flex-1" onClick={handleRelistConfirm} disabled={isRelisting || !relistPrice || parseFloat(relistPrice) <= 0}>
              {t('dashboard.relistConfirm')}
            </Button>
          </div>
        </div>
      </Modal>

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
