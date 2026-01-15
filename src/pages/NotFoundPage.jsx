import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import { useI18n } from '../stores/useI18nStore'
import Button from '../components/Button'

const NotFoundPage = () => {
  const { t } = useI18n()
  
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-100 mb-4">{t('errors.notFound.title')}</h1>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('errors.notFound.heading')}
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            {t('errors.notFound.description')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button size="lg">
              <Home size={18} className="inline mr-2" />
              {t('errors.notFound.goHome')}
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={18} className="inline mr-2" />
            {t('errors.notFound.goBack')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage


