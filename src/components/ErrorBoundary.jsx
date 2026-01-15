import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useI18nStore } from '../stores/useI18nStore'
import Button from './Button'

// Error display component that can use hooks
const ErrorDisplay = () => {
  const t = useI18nStore((state) => state.t)
  
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('errors.generic.title')}
          </h2>
          <p className="text-gray-600 mb-6">
            {t('errors.generic.description')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={18} className="inline mr-2" />
            {t('errors.generic.refresh')}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => window.location.href = '/'}
          >
            {t('errors.notFound.goHome')}
          </Button>
        </div>
      </div>
    </div>
  )
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorDisplay />
    }

    return this.props.children
  }
}

export default ErrorBoundary


