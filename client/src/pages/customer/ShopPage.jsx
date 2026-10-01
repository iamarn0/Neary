import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { shopApi } from '../../services'
import { useAuth } from '../../context/AuthContext'
import { useLocationSelection } from '../../context/LocationContext'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useToast } from '../../context/ToastContext'
import Media from '../../components/Media'
import ProductCard from '../../components/ProductCard'
import Rating from '../../components/ui/Rating'
import ShopMap from '../../components/maps/ShopMap'
import { formatDistance, formatINR } from '../../lib/format'
import { useCart } from '../../features/cart/useCart'
import { SkeletonShop } from '../../components/ui/Skeleton'
import { TextInput } from '../../components/ui/Field'
import Button from '../../components/ui/Button'

export default function ShopPage() {
  const { id } = useParams()
  const { location } = useLocationSelection()
  const { user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [q, setQ] = useState('')
  const [draft, setDraft] = useState('')
  const [category, setCategory] = useState('')
  const cart = useCart()
  useEffect(() => {
    const handle = setTimeout(() => setQ(draft), 250)
    return () => clearTimeout(handle)
  }, [draft])
  const params = { longitude: location?.coordinates?.[0], latitude: location?.coordinates?.[1] }
  const shop = useQuery({ queryKey: ['shop', id, params], queryFn: () => shopApi.get(id, params) })
  const products = useQuery({ queryKey: ['shop-products', id, q, category], queryFn: () => shopApi.products(id, { q, category }) })
  const reviews = useQuery({ queryKey: ['shop-reviews', id], queryFn: () => shopApi.reviews(id) })
  const favorite = useMutation({
    mutationFn: () => shopApi.favorite(id),
    onSuccess: (result) => {
      toast.success(result.favorite ? 'Saved to favorites' : 'Removed from favorites')
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
    onError: (error) => toast.error(error.message),
  })
  usePageMeta(shop.data ? `${shop.data.shop.name} · NEARE` : 'Shop · NEARE')

  if (shop.isLoading) return <SkeletonShop />
  if (shop.isError) return <p className="text-sm text-muted">{shop.error.message}</p>
  const record = shop.data.shop
  const sameCart = String(cart.query.data?.cart?.shop?._id) === String(record._id)
  const cartItems = sameCart ? cart.query.data?.cart?.items || [] : []
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <article className="space-y-6 pb-24">
      <div className="relative">
        <Media src={record.coverImage || record.logo} alt="" className="aspect-[2.4/1] max-h-72 w-full" loading="eager" />
        <Media src={record.logo} alt="" className="absolute bottom-4 left-4 h-16 w-16 border-4 border-white" />
      </div>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{record.category?.name}</p>
          <h1 className="text-3xl font-semibold">{record.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            {record.reviewCount > 0 ? <Rating value={record.rating} count={record.reviewCount} /> : <span className="text-muted">New</span>}
            <span>{formatDistance(shop.data.distance)} away</span>
            <span className={record.isOpen ? 'text-success' : 'text-muted'}>{record.isOpen ? 'Open' : 'Closed'}</span>
          </div>
          <p className="mt-2 text-sm text-muted">
            {record.prepTimeMin}–{record.prepTimeMax} min
            {record.deliveryAvailable ? ' · Delivery' : ''}
            {record.pickupAvailable ? ' · Pickup' : ''}
          </p>
          <p className="mt-1 text-sm text-muted">{record.address}, {record.city} {record.pinCode}</p>
        </div>
        {user?.role === 'CUSTOMER' ? <Button variant="ghost" onClick={() => favorite.mutate()}>Save</Button> : null}
      </header>
      <ShopMap shop={record} />
      <TextInput value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Search ${record.name} products...`} aria-label={`Search ${record.name} products`} />
      <div className="flex gap-2 overflow-auto">
        <button type="button" className={`rounded-lg border px-3 py-2 text-sm ${!category ? 'border-ink' : 'border-line'}`} onClick={() => setCategory('')}>All</button>
        {(record.categories || []).map((item) => (
          <button key={item._id} type="button" className={`rounded-lg border px-3 py-2 text-sm ${category === item._id ? 'border-ink' : 'border-line'}`} onClick={() => setCategory(item._id)}>{item.name}</button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {(products.data?.products || []).map((product) => <ProductCard key={product._id} product={product} shop={record} distance={shop.data.distance} />)}
      </div>
      {!products.isLoading && !(products.data?.products || []).length ? <p className="text-sm text-muted">No products match that search.</p> : null}
      {cartCount ? (
        <div className="fixed inset-x-0 bottom-16 z-30 border-t border-line bg-white px-4 py-3 md:bottom-4 md:left-auto md:right-6 md:w-80 md:border">
          <Link to="/cart" className="flex items-center justify-between text-sm font-medium">
            <span>{cartCount} in cart · {record.name}</span>
            <span>{formatINR(cartTotal)}</span>
          </Link>
        </div>
      ) : null}
      <section>
        <h2 className="font-semibold">Reviews</h2>
        <div className="mt-3 space-y-3">
          {(reviews.data?.reviews || []).map((review) => (
            <article key={review._id} className="rounded-xl border border-line bg-white p-4">
              <Rating value={review.rating} />
              <p className="mt-2 text-sm">{review.comment}</p>
              <p className="mt-1 text-xs text-muted">{review.customer?.name}</p>
            </article>
          ))}
          {!reviews.data?.reviews?.length ? <p className="text-sm text-muted">No reviews yet.</p> : null}
        </div>
      </section>
    </article>
  )
}
