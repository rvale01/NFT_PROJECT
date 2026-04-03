import { AlertCircle, Info, Wallet } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import ImageUpload, { ImageData } from '../components/ImageUpload'
import LoadingSpinner from '../components/LoadingSpinner'
import Modal from '../components/Modal'
import { useI18n } from '../stores/useI18nStore'
import { useNFTStore } from '../stores/useNFTStore'
import { useToastStore } from '../stores/useToastStore'
import { useWalletStore } from '../stores/useWalletStore'
import { uploadToIPFS } from '../utils/algorand'
import { NETWORK_INFO } from '../utils/constants'

interface FormData {
  name: string
  description: string
  price: string
  royalty: string
}

interface FormErrors {
  image?: string
  name?: string
  price?: string
  royalty?: string
}

const CreateNFTPage: React.FC = () => {
  const navigate = useNavigate()
  const account = useWalletStore((state) => state.account)
  const isConnected = useWalletStore((state) => state.isConnected)
  const connect = useWalletStore((state) => state.connect)
  const peraWallet = useWalletStore((state) => state.peraWallet)
  const createNFT = useNFTStore((state) => state.createNFT)
  const success = useToastStore((state) => state.success)
  const showError = useToastStore((state) => state.error)
  const { t } = useI18n()

  const [image, setImage] = useState<ImageData | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price: '',
    royalty: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!image) {
      newErrors.image = t('create.errors.imageRequired')
    }

    if (!formData.name.trim()) {
      newErrors.name = t('create.errors.nameRequired')
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = t('create.errors.priceRequired')
    }

    if (formData.royalty && (parseFloat(formData.royalty) < 0 || parseFloat(formData.royalty) > 100)) {
      newErrors.royalty = t('create.errors.royaltyInvalid')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (!isConnected) {
      setShowWalletModal(true)
      return
    }

    setIsSubmitting(true)

    try {
      // Upload image (in production, this would upload to IPFS)
      const imageUrl = await uploadToIPFS(image!.file)

      // Create NFT (with real on-chain mint if wallet is connected)
      await createNFT(
        {
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          royalty: formData.royalty ? parseFloat(formData.royalty) : 0,
          imageUrl,
          creator: account ?? '',
        },
        peraWallet,
      )

      success(t('toast.nftCreated'))
      setTimeout(() => {
        navigate('/marketplace')
      }, 1000)
    } catch (err) {
      console.error('Error creating NFT:', err)
      showError(t('toast.createFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConnectWallet = async () => {
    await connect()
    setShowWalletModal(false)
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('create.title')}</h1>
          <p className="text-lg text-gray-600">
            {t('create.description')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('create.imageUpload')} <span className="text-red-500">*</span>
            </label>
            {errors.image && (
              <p className="text-sm text-red-500 mb-2">{errors.image}</p>
            )}
            <ImageUpload image={image} onImageChange={setImage} />
          </div>

          {/* NFT Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              {t('create.nftName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="My Awesome NFT"
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              maxLength={50}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              {t('create.description')}
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your NFT..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              maxLength={1000}
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.description.length}/1000 {t('create.characters')}
            </p>
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              {t('create.price')} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="10"
              step="0.1"
              min="0"
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.price ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.price && (
              <p className="text-sm text-red-500 mt-1">{errors.price}</p>
            )}
          </div>

          {/* Royalty */}
          <div>
            <label htmlFor="royalty" className="block text-sm font-medium text-gray-700 mb-2">
              {t('create.royalty')}
            </label>
            <input
              type="number"
              id="royalty"
              name="royalty"
              value={formData.royalty}
              onChange={handleInputChange}
              placeholder="5"
              step="0.1"
              min="0"
              max="100"
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.royalty ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.royalty && (
              <p className="text-sm text-red-500 mt-1">{errors.royalty}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              {t('create.royaltyHint')}
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start">
              <Info className="text-blue-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">{t('create.lazyMintingInfo.title')}</p>
                <p>
                  {t('create.lazyMintingInfo.description', { fee: NETWORK_INFO.fee, currency: NETWORK_INFO.currency })}
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {t('common.loading')}
                </>
              ) : (
                t('create.listForSale')
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => navigate('/marketplace')}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </div>

      {/* Wallet Connection Modal */}
      <Modal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        title={t('wallet.connectRequired')}
      >
        <div className="space-y-4">
          <div className="flex items-start bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <AlertCircle className="text-yellow-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-yellow-900">
              {t('wallet.connectDescription')}
            </p>
          </div>

          <div className="flex items-center justify-center p-8 bg-gray-50 rounded-xl">
            <Wallet size={64} className="text-gray-400" />
          </div>

          <p className="text-sm text-gray-600 text-center">
            {t('wallet.approveConnection')}
          </p>

          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowWalletModal(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button className="flex-1" onClick={handleConnectWallet}>
              {t('common.connectWallet')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default CreateNFTPage
