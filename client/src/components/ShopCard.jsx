import { Link } from 'react-router-dom'
import Media from './Media'
import Rating from './ui/Rating'
import { formatDistance } from '../lib/format'

export default function ShopCard({ shop, distance }) {
  return (
    <Link to={`/shops/${shop._id}`} className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:-translate-y-0.5">
      <Media src={shop.coverImage || shop.logo} alt="" className="h-36 w-full" />
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold">{shop.name}</h3>
          {shop.reviewCount > 0 ? <Rating value={shop.rating} count={shop.reviewCount} /> : <span className="text-xs text-muted">New</span>}
        </div>
        <p className="text-sm text-muted">
          {formatDistance(distance)}{distance != null ? ' · ' : ''}{shop.city}
        </p>
        <p className="text-sm">
          <span className={shop.isOpen ? 'text-success' : 'text-muted'}>{shop.isOpen ? 'Open' : 'Closed'}</span>
          {shop.deliveryAvailable ? <span className="text-muted"> · Delivery {shop.prepTimeMin}–{shop.prepTimeMax} min</span> : null}
          {shop.pickupAvailable ? <span className="text-muted"> · Pickup</span> : null}
        </p>
      </div>
    </Link>
  )
}
