import { Link, useNavigate } from 'react-router-dom'
import { Wallet, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useWalletStore } from '../stores/useWalletStore'
import { useI18n } from '../stores/useI18nStore'
import LanguageSwitcher from './LanguageSwitcher'

const Navbar: React.FC = () => {
  const account = useWalletStore((state) => state.account)
  const isConnected = useWalletStore((state) => state.isConnected)
  const connect = useWalletStore((state) => state.connect)
  const disconnect = useWalletStore((state) => state.disconnect)
  const { t } = useI18n()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleWalletClick = async () => {
    if (isConnected) {
      await disconnect()
    } else {
      await connect()
    }
  }

  const formatAddress = (address: string | null): string => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Suppress unused navigate warning – kept for potential future use
  void navigate

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-semibold text-gray-900">AlgoNFT</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/marketplace"
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              {t('common.marketplace')}
            </Link>
            <Link
              to="/create"
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              {t('common.createNFT')}
            </Link>
            {isConnected && (
              <Link
                to="/dashboard"
                className="text-gray-700 hover:text-primary-600 transition-colors"
              >
                {t('common.dashboard')}
              </Link>
            )}
            <LanguageSwitcher />
            <button
              onClick={handleWalletClick}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Wallet size={18} />
              <span>
                {isConnected ? formatAddress(account) : t('common.connectWallet')}
              </span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <LanguageSwitcher />
            <button
              onClick={handleWalletClick}
              className="flex items-center space-x-1 px-3 py-2 bg-primary-600 text-white rounded-lg text-sm"
            >
              <Wallet size={16} />
              {isConnected && <span className="text-xs">{formatAddress(account)}</span>}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-700"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-gray-200">
            <Link
              to="/marketplace"
              className="block text-gray-700 hover:text-primary-600 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('common.marketplace')}
            </Link>
            <Link
              to="/create"
              className="block text-gray-700 hover:text-primary-600 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('common.createNFT')}
            </Link>
            {isConnected && (
              <Link
                to="/dashboard"
                className="block text-gray-700 hover:text-primary-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('common.dashboard')}
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
