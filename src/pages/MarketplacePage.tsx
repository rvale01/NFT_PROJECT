import { useState, useMemo, useEffect } from 'react'
import { Filter, Grid } from 'lucide-react'
import { useNFTStore } from '../stores/useNFTStore'
import { useI18n } from '../stores/useI18nStore'
import NFTCard from '../components/NFTCard'

type FilterOption = 'all' | 'price-low' | 'price-high' | 'newest'

const MarketplacePage: React.FC = () => {
  const nfts = useNFTStore((state) => state.nfts)
  const fetchNFTs = useNFTStore((state) => state.fetchNFTs)
  const { t } = useI18n()

  useEffect(() => {
    fetchNFTs()
  }, [fetchNFTs])
  const [filter, setFilter] = useState<FilterOption>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter and sort NFTs
  const filteredNFTs = useMemo(() => {
    let result = nfts.filter((nft) => nft.status === 'listed' || nft.status === 'minted')

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (nft) =>
          nft.name.toLowerCase().includes(query) ||
          nft.description?.toLowerCase().includes(query)
      )
    }

    // Sort filter
    switch (filter) {
      case 'price-low':
        result = [...result].sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        result = [...result].sort((a, b) => b.price - a.price)
        break
      case 'newest':
        result = [...result].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        break
      default:
        break
    }

    return result
  }, [nfts, filter, searchQuery])

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('marketplace.title')}</h1>
          <p className="text-lg text-gray-600">
            {t('marketplace.description')}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder={t('marketplace.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterOption)}
                className="w-full md:w-48 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer"
              >
                <option value="all">{t('marketplace.allNFTs')}</option>
                <option value="newest">{t('marketplace.newestFirst')}</option>
                <option value="price-low">{t('marketplace.priceLowToHigh')}</option>
                <option value="price-high">{t('marketplace.priceHighToLow')}</option>
              </select>
              <Filter
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                size={20}
              />
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredNFTs.length === 1
              ? t('marketplace.nftFoundOne', { count: filteredNFTs.length })
              : t('marketplace.nftFoundMany', { count: filteredNFTs.length })}
          </p>
        </div>

        {/* NFT Grid */}
        {filteredNFTs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredNFTs.map((nft) => (
              <NFTCard key={nft.id} nft={nft} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <Grid className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('marketplace.noNFTs')}
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? t('marketplace.noResults')
                : t('marketplace.beFirst')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MarketplacePage
