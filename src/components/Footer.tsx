import React from 'react'
import { Link } from 'react-router-dom'
import { Github, Twitter, Mail } from 'lucide-react'
import { useI18n } from '../stores/useI18nStore'

const Footer: React.FC = () => {
  const { t } = useI18n()

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">AlgoNFT</span>
            </Link>
            <p className="text-gray-600 text-sm max-w-md">
              {t('footer.description')}
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{t('footer.platform')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/marketplace" className="text-gray-600 hover:text-primary-600 text-sm transition-colors">
                  {t('common.marketplace')}
                </Link>
              </li>
              <li>
                <Link to="/create" className="text-gray-600 hover:text-primary-600 text-sm transition-colors">
                  {t('common.createNFT')}
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-gray-600 hover:text-primary-600 text-sm transition-colors">
                  {t('common.dashboard')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{t('footer.resources')}</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://www.algorand.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-primary-600 text-sm transition-colors"
                >
                  {t('footer.aboutAlgorand')}
                </a>
              </li>
              <li>
                <a
                  href="https://perawallet.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-primary-600 text-sm transition-colors"
                >
                  {t('footer.getPeraWallet')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} AlgoNFT Marketplace. {t('footer.allRightsReserved')}
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a
              href="#"
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="GitHub"
            >
              <Github size={20} />
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Twitter"
            >
              <Twitter size={20} />
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Email"
            >
              <Mail size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
