import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  User,
  Clock,
  Wallet,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react'
import { useWalletStore } from '../stores/useWalletStore'
import { useNFTStore, NFT } from '../stores/useNFTStore'
import { useToastStore } from '../stores/useToastStore'
import { useI18n } from '../stores/useI18nStore'
import { NETWORK_INFO } from '../utils/constants'
import { formatAddress, formatDate } from '../utils/helpers'
import Button from '../components/Button'
import Modal from '../components/Modal'
import LoadingSpinner from '../components/LoadingSpinner'

const NFTDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const account = useWalletStore((state) => state.account)
  const isConnected = useWalletStore((state) => state.isConnected)
  const connect = useWalletStore((state) => state.connect)
  const peraWallet = useWalletStore((state) => state.peraWallet)
  const nfts = useNFTStore((state) => state.nfts)
  const buyNFT = useNFTStore((state) => state.buyNFT)
  const success = useToastStore((state) => state.success)
  const showError = useToastStore((state) => state.error)
  const { t } = useI18n()

  const [nft, setNft] = useState<NFT | undefined>(undefined)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)

  // Suppress unused variable warnings for connect/isConnected used conditionally
  void isConnected

  useEffect(() => {
    const foundNFT = nfts.find((n) => n.id === id)
    setNft(foundNFT)
  }, [id, nfts])

  const handleBuyClick = () => {
    if (!account) {
      setShowConnectModal(true)
      return
    }

    if (!nft) return

    if (nft.creator === account) {
      showError(t('toast.cantBuyOwn'))
      return
    }

    setShowBuyModal(true)
  }

  const handlePurchase = async () => {
    if (!nft || !account) return

    setIsPurchasing(true)

    try {
      const purchased = await buyNFT(nft.id, account, peraWallet)

      if (purchased) {
        setPurchaseSuccess(true)
        setShowBuyModal(false)
        success(t('toast.purchaseSuccess'))
        // Update local state
        setNft({ ...nft, status: 'minted', owner: account })
      }
    } catch (err) {
      console.error('Purchase error:', err)
      showError(t('toast.purchaseFailed'))
    } finally {
      setIsPurchasing(false)
    }
  }

  if (!nft) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">{t('errors.notFound.heading')}</h2>
          <p className="text-gray-600 mb-4">{t('errors.notFound.description')}</p>
          <Button onClick={() => navigate('/marketplace')}>{t('common.marketplace')}</Button>
        </div>
      </div>
    )
  }

  const isCreator = nft.creator === account
  const isListed = nft.status === 'listed'

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          {t('nftDetail.back')}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-lg animate-fade-in">
            <div className="aspect-square bg-gray-100">
              <img
                src={nft.imageUrl}
                alt={nft.name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x600?text=NFT'
                }}
              />
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Status Badge */}
            {nft.status === 'listed' && (
              <div className="inline-block bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
                {t('nftDetail.listed')}
              </div>
            )}
            {nft.status === 'minted' && (
              <div className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                {t('nftDetail.sold')}
              </div>
            )}

            {/* Title */}
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{nft.name}</h1>
              {nft.description && (
                <p className="text-lg text-gray-600 leading-relaxed">
                  {nft.description}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-6">
              <p className="text-sm text-gray-600 mb-2">{t('nftDetail.currentPrice')}</p>
              <p className="text-4xl font-bold text-primary-600">
                {nft.price} <span className="text-2xl">ALGO</span>
              </p>
              {isListed && (
                <p className="text-sm text-gray-600 mt-2">
                  {t('nftDetail.mintingFee', { fee: NETWORK_INFO.fee, currency: NETWORK_INFO.currency })}
                </p>
              )}
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center text-gray-600 mb-2">
                  <User size={18} className="mr-2" />
                  <span className="text-sm font-medium">{t('nftDetail.creator')}</span>
                </div>
                <p className="text-sm font-mono text-gray-900">
                  {formatAddress(nft.creator)}
                </p>
              </div>

              {nft.owner && (
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center text-gray-600 mb-2">
                    <Wallet size={18} className="mr-2" />
                    <span className="text-sm font-medium">{t('nftDetail.owner')}</span>
                  </div>
                  <p className="text-sm font-mono text-gray-900">
                    {formatAddress(nft.owner)}
                  </p>
                </div>
              )}

              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center text-gray-600 mb-2">
                  <Clock size={18} className="mr-2" />
                  <span className="text-sm font-medium">{t('nftDetail.created')}</span>
                </div>
                <p className="text-sm text-gray-900">{formatDate(nft.createdAt)}</p>
              </div>

              {nft.royalty !== undefined && nft.royalty > 0 && (
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center text-gray-600 mb-2">
                    <span className="text-sm font-medium">{t('nftDetail.royalty')}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {nft.royalty}%
                  </p>
                </div>
              )}
            </div>

            {/* Buy Button */}
            {isListed && !isCreator && (
              <Button
                size="lg"
                onClick={handleBuyClick}
                className="w-full"
              >
                {t('nftDetail.buyNow')}
              </Button>
            )}

            {isListed && isCreator && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-900">
                  {t('nftDetail.yourNFT')}
                </p>
              </div>
            )}

            {!isListed && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-900">
                  {t('nftDetail.alreadySold')}
                </p>
              </div>
            )}

            {/* Info Box */}
            {isListed && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-900">
                  {t('nftDetail.howItWorks', { fee: NETWORK_INFO.fee, currency: NETWORK_INFO.currency })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Buy Confirmation Modal */}
      <Modal
        isOpen={showBuyModal}
        onClose={() => !isPurchasing && setShowBuyModal(false)}
        title={t('nftDetail.confirmPurchase')}
      >
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600">{t('nftDetail.modalNFT')}</span>
              <span className="font-semibold text-gray-900">{nft.name}</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600">{t('nftDetail.modalPrice')}</span>
              <span className="font-semibold text-gray-900">{nft.price} ALGO</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t('nftDetail.modalMintingFee')}</span>
              <span className="font-semibold text-gray-900">
                ~{NETWORK_INFO.fee} {NETWORK_INFO.currency}
              </span>
            </div>
            <div className="border-t border-gray-300 mt-4 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">{t('nftDetail.total')}</span>
                <span className="text-xl font-bold text-primary-600">
                  {nft.price} ALGO
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              {t('nftDetail.purchaseInfo')}
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowBuyModal(false)}
              disabled={isPurchasing}
            >
              {t('common.cancel')}
            </Button>
            <Button
              className="flex-1"
              onClick={handlePurchase}
              disabled={isPurchasing}
            >
              {isPurchasing ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {t('nftDetail.processing')}
                </>
              ) : (
                t('nftDetail.confirmPurchase')
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Connect Wallet Modal */}
      <Modal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        title={t('wallet.connectRequired')}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {t('nftDetail.connectToBuy')}
          </p>
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowConnectModal(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button className="flex-1" onClick={connect}>
              {t('common.connectWallet')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={purchaseSuccess}
        onClose={() => {
          setPurchaseSuccess(false)
          navigate('/dashboard')
        }}
        title={t('nftDetail.purchaseSuccess.title')}
      >
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>
          <p className="text-lg text-gray-900">
            {t('nftDetail.purchaseSuccess.message')}
          </p>
          <p className="text-sm text-gray-600">
            {t('nftDetail.purchaseSuccess.viewDashboard')}
          </p>
          <Button
            className="w-full"
            onClick={() => {
              setPurchaseSuccess(false)
              navigate('/dashboard')
            }}
          >
            {t('nftDetail.purchaseSuccess.button')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default NFTDetailPage
