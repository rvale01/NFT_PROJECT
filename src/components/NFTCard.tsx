import { Clock, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { NFT } from '../stores/useNFTStore'
import { formatAddress, formatRelativeTime } from '../utils/helpers'

interface NFTCardProps {
  nft: NFT
}

const NFTCard: React.FC<NFTCardProps> = ({ nft }) => {
  return (
    <Link to={`/nft/${nft.id}`}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer animate-scale-in">
        <div className="aspect-square relative overflow-hidden bg-gray-100">
          <img
            src={nft.imageUrl}
            alt={nft.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=NFT'
            }}
          />
          {nft.status === 'listed' && (
            <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
              Listed
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg text-gray-900 mb-2 truncate">
            {nft.name}
          </h3>
          {nft.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {nft.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Price</p>
              <p className="text-xl font-bold text-primary-600">
                {nft.price} ALGO
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center text-xs text-gray-500 mb-1">
                <User size={12} className="mr-1" />
                {formatAddress(nft.creator)}
              </div>
              <div className="flex items-center text-xs text-gray-400">
                <Clock size={12} className="mr-1" />
                {formatRelativeTime(nft.createdAt)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default NFTCard
