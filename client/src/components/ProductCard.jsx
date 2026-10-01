import { Link } from 'react-router-dom'
import Media from './Media'
import Price from './ui/Price'
import { useCart } from '../features/cart/useCart'
import { formatDistance } from '../lib/format'

export default function ProductCard({ product, shop, distance }) {
  const cart = useCart()
  const line = cart.query.data?.cart?.items?.find((item) => String(item.product) === String(product._id))
  const available = product.isAvailable !== false && (product.stock == null || product.stock > 0)
  const distanceLabel = typeof distance === 'number' ? formatDistance(distance) : distance
  const busy = cart.add.isPending || cart.update.isPending

  function stop(event) {
    event.preventDefault()
    event.stopPropagation()
  }

  function add(event) {
    stop(event)
    if (!available) return
    cart.add.mutate({ productId: product._id, quantity: 1 })
  }

  function setQuantity(event, quantity) {
    stop(event)
    cart.update.mutate({ productId: product._id, quantity })
  }

  return (
    <article className="flex gap-3 border border-line bg-white p-3">
      <Link to={`/products/${product._id}`} className="flex min-w-0 flex-1 gap-3">
        <Media src={product.images?.[0] || product.image} alt={product.name} className="aspect-square h-20 w-20 shrink-0" />
        <div className="min-w-0">
          <h3 className="truncate font-medium">{product.name}</h3>
          {product.unit ? <p className="text-sm text-muted">{product.unit}</p> : null}
          {shop ? (
            <p className="mt-0.5 truncate text-sm text-muted">
              {shop.name}{distanceLabel ? ` · ${distanceLabel}` : ''}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Price price={product.price} salePrice={product.salePrice} unit={shop ? '' : product.unit} />
            {available ? null : <span className="text-xs text-muted">Out of stock</span>}
            {shop?.isOpen === false ? <span className="text-xs text-muted">Closed</span> : null}
            {shop?.isOpen ? <span className="text-xs text-success">Open</span> : null}
          </div>
        </div>
      </Link>
      {cart.enabled ? (
        <div className="self-end">
          {line ? (
            <div className="flex items-center border border-line">
              <button type="button" className="h-9 w-9" aria-label={`Decrease ${product.name}`} disabled={busy} onClick={(event) => setQuantity(event, line.quantity - 1)}>−</button>
              <span className="min-w-6 text-center text-sm" aria-live="polite">{line.quantity}</span>
              <button type="button" className="h-9 w-9" aria-label={`Increase ${product.name}`} disabled={busy || (product.stock != null && line.quantity >= product.stock)} onClick={(event) => setQuantity(event, line.quantity + 1)}>+</button>
            </div>
          ) : (
            <button
              type="button"
              className="h-9 w-9 border border-ink text-lg leading-none disabled:opacity-40"
              aria-label={`Add ${product.name}`}
              disabled={!available || busy}
              onClick={add}
            >
              +
            </button>
          )}
        </div>
      ) : null}
    </article>
  )
}
