import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { productApi, shopApi } from '../../services'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { useLocationSelection } from '../../context/LocationContext'
import { useCart } from '../../features/cart/useCart'
import { usePageMeta } from '../../hooks/usePageMeta'
import Media from '../../components/Media'
import ProductCard from '../../components/ProductCard'
import Price from '../../components/ui/Price'
import Button from '../../components/ui/Button'
import CartConflict from '../../components/CartConflict'
import { SkeletonProduct } from '../../components/ui/Skeleton'
import { formatDistance, formatStatus } from '../../lib/format'

function formatWhen(value) {
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function ProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { location } = useLocationSelection()
  const cart = useCart()
  const toast = useToast()
  const [quantity, setQuantity] = useState(1)
  const query = useQuery({
    queryKey: ['product', id, location?.coordinates],
    queryFn: () => productApi.get(id, {
      longitude: location?.coordinates?.[0],
      latitude: location?.coordinates?.[1],
    }),
  })
  usePageMeta(query.data ? `${query.data.product.name} · NEARE` : 'Product · NEARE')

  if (query.isLoading) return <SkeletonProduct />
  if (query.isError) return <p className="text-sm">{query.error.message}</p>
  const { product, shop, distance, insights } = query.data
  const available = product.isAvailable && product.stock > 0
  const trendMax = Math.max(...(insights?.trends || []).map((row) => row.quantity), 1)

  function add() {
    if (!user) {
      navigate('/login')
      return
    }
    cart.add.mutate({ productId: product._id, quantity })
  }

  return (
    <div>
      <article className="grid gap-8 md:grid-cols-2">
        <Media src={product.images?.[0]} alt={product.name} className="h-80 w-full rounded-2xl" />
        <div>
          <h1 className="text-3xl font-semibold">{product.name}</h1>
          <div className="mt-3"><Price price={product.price} salePrice={product.salePrice} unit={product.unit} /></div>
          <p className="mt-4 text-sm leading-6 text-muted">{product.description}</p>
          <p className="mt-4 text-sm">{available ? 'Available' : 'Out of stock'}{product.stock > 0 ? <span className="text-muted"> · {product.stock} {product.unit} in stock</span> : null}</p>
          <p className="mt-2 text-sm">
            Sold by <Link className="font-medium underline" to={`/shops/${shop._id}`}>{shop.name}</Link>
            {distance != null ? <span className="text-muted"> · {formatDistance(distance)} away</span> : null}
          </p>
          {insights?.demand?.monthOrders ? (
            <p className="mt-3 text-sm text-muted">
              {insights.demand.monthQuantity} {product.unit} ordered in the last 30 days
              {insights.demand.rank ? ` · #${insights.demand.rank} among recent orders` : ''}
            </p>
          ) : null}
          {insights?.history?.length ? (
            <p className="mt-1 text-sm text-muted">You have bought {insights.bought} {product.unit} across {insights.history.length} {insights.history.length === 1 ? 'order' : 'orders'}.</p>
          ) : null}
          <div className="mt-6 flex items-center gap-3">
            <button type="button" className="h-10 w-10 rounded-lg border border-line" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity">−</button>
            <span aria-live="polite">{quantity}</span>
            <button type="button" className="h-10 w-10 rounded-lg border border-line" onClick={() => setQuantity((value) => value + 1)} aria-label="Increase quantity">+</button>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="brand" disabled={!available || cart.add.isPending} onClick={add}>Add to cart</Button>
            <Button variant="ghost" onClick={() => shopApi.favoriteProduct(product._id).then((result) => toast.success(result.favorite ? 'Saved product' : 'Removed product')).catch((error) => toast.error(error.message))}>Save</Button>
          </div>
        </div>
      </article>

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white p-4">
          <h2 className="font-semibold">Bought before</h2>
          <p className="mt-1 text-sm text-muted">Earlier purchases of this item.</p>
          {insights?.history?.length ? (
            <ul className="mt-4 divide-y divide-line">
              {insights.history.map((row) => (
                <li key={row._id}>
                  <Link to={`/orders/${row._id}`} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <span>
                      <span className="font-medium">{row.orderNumber}</span>
                      <span className="mt-0.5 block text-muted">{formatWhen(row.at)} · {row.quantity} {product.unit}</span>
                    </span>
                    <span className="text-muted">{formatStatus(row.status)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">You have not ordered this yet.</p>
          )}
        </section>
        <section className="rounded-2xl border border-line bg-white p-4">
          <h2 className="font-semibold">Trending</h2>
          <p className="mt-1 text-sm text-muted">Ranked by quantity ordered in the last 30 days.</p>
          {insights?.trends?.length ? (
            <ol className="mt-4 space-y-3">
              {insights.trends.map((row) => (
                <li key={row.product._id}>
                  {row.current ? (
                    <div className="text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium">{row.rank}. {row.product.name}</span>
                        <span className="text-muted">{row.quantity} {row.product.unit}</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(8, (row.quantity / trendMax) * 100)}%` }} />
                      </div>
                    </div>
                  ) : (
                    <Link to={`/products/${row.product._id}`} className="block text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span>{row.rank}. {row.product.name}</span>
                        <span className="text-muted">{row.quantity} {row.product.unit}</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                        <div className="h-full rounded-full bg-ink" style={{ width: `${Math.max(8, (row.quantity / trendMax) * 100)}%` }} />
                      </div>
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-muted">No orders in the last 30 days.</p>
          )}
        </section>
      </div>

      {insights?.paired?.length ? (
        <section className="mt-8">
          <h2 className="font-semibold">Frequently bought with</h2>
          <p className="mt-1 text-sm text-muted">Other items that showed up in the same orders.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {insights.paired.map((row) => (
              <div key={row.product._id}>
                <ProductCard product={row.product} shop={row.shop} distance={row.distance != null ? formatDistance(row.distance) : null} />
                <p className="mt-1 px-1 text-xs text-muted">{row.note}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {insights?.suggestions?.length ? (
        <section className="mt-8">
          <h2 className="font-semibold">Popular in this shop</h2>
          <p className="mt-1 text-sm text-muted">From this shop and the same category.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {insights.suggestions.map((row) => (
              <div key={row.product._id}>
                <ProductCard product={row.product} shop={row.shop} distance={row.distance != null ? formatDistance(row.distance) : null} />
                <p className="mt-1 px-1 text-xs text-muted">{row.note}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <CartConflict
        open={Boolean(cart.conflict)}
        currentShop={cart.conflict?.currentShop}
        nextShop={cart.conflict?.nextShop}
        onKeep={() => cart.setConflict(null)}
        onClear={cart.clearAndAdd}
      />
    </div>
  )
}
