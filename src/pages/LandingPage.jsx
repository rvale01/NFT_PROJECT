import { ArrowRight, CheckCircle, Coins, Leaf, List, Shield, Sparkles, Upload, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '../stores/useI18nStore'
import Button from '../components/Button'

const LandingPage = () => {
  const { t } = useI18n()
  
  const steps = [
    {
      icon: Upload,
      title: t('landing.step1.title'),
      description: t('landing.step1.description'),
    },
    {
      icon: List,
      title: t('landing.step2.title'),
      description: t('landing.step2.description'),
    },
    {
      icon: CheckCircle,
      title: t('landing.step3.title'),
      description: t('landing.step3.description'),
    },
    {
      icon: Coins,
      title: t('landing.step4.title'),
      description: t('landing.step4.description'),
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 text-balance">
            {t('landing.title')}
            <br />
            <span className="text-primary-600">{t('landing.subtitle')}</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto text-balance">
            {t('landing.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/create">
              <Button size="lg" className="w-full sm:w-auto">
                {t('landing.createCTA')}
                <ArrowRight className="inline ml-2" size={20} />
              </Button>
            </Link>
            <Link to="/marketplace">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                {t('landing.exploreCTA')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('landing.howItWorks')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('landing.howItWorksDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="text-primary-600" size={24} />
                </div>
                <div className="flex items-center mb-2">
                  <span className="text-sm font-semibold text-primary-600 mr-2">
                    Step {index + 1}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('landing.whyChoose')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Leaf className="text-green-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('landing.feature1.title')}
              </h3>
              <p className="text-gray-600">
                {t('landing.feature1.description')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="text-yellow-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('landing.feature2.title')}
              </h3>
              <p className="text-gray-600">
                {t('landing.feature2.description')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('landing.feature3.title')}
              </h3>
              <p className="text-gray-600">
                {t('landing.feature3.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Lazy Minting Explanation */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-3xl p-8 md:p-12">
          <div className="flex items-start mb-6">
            <Sparkles className="text-primary-600 mr-4 flex-shrink-0" size={32} />
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                {t('landing.lazyMinting.title')}
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                {t('landing.lazyMinting.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-3xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('landing.cta.title')}
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            {t('landing.cta.description')}
          </p>
          <Link to="/create">
            <Button size="lg" variant="secondary">
              {t('landing.cta.button')}
              <ArrowRight className="inline ml-2" size={20} />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

export default LandingPage


