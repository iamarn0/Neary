import { Link } from 'react-router-dom'
import Media from './Media'
import Price from './ui/Price'

export default function ProductCard({ product, shop, distance }) {
  return (
    <Link to={`/products/${product._id}`} className="flex gap-3 rounded-2xl border border-line bg-white p-3 shadow-sm">
      <Media src={product.images?.[0]} alt="" className="h-20 w-20 shrink-0 rounded-xl" />
      <div className="min-w-0">
        <h3 className="truncate font-medium">{product.name}</h3>
        {shop ? <p className="mt-0.5 text-sm text-muted">{shop.name}{distance != null ? ` · ${distance}` : ''}</p> : null}
        <div className="mt-2">
          <Price price={product.price} salePrice={product.salePrice} unit={product.unit} />
        </div>
      </div>
    </Link>
  )
}
