import { useState } from 'react'
import { useParams } from 'react-router-dom'
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
import { formatDistance } from '../../lib/format'
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
  const [category, setCategory] = useState('')
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

  return (
    <article className="space-y-6">
      <Media src={record.coverImage || record.logo} alt="" className="h-52 w-full rounded-2xl" />
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{record.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <Rating value={record.rating} count={record.reviewCount} />
            <span>{formatDistance(shop.data.distance)} away</span>
            <span className={record.isOpen ? 'text-success' : 'text-muted'}>{record.isOpen ? 'Open now' : 'Closed'}</span>
          </div>
          <p className="mt-2 text-sm text-muted">
            {record.deliveryAvailable ? `Delivery ${record.prepTimeMin}–${record.prepTimeMax} min` : 'Delivery unavailable'}
            {record.pickupAvailable ? ' · Pickup available' : ''}
          </p>
          <p className="mt-1 text-sm text-muted">{record.address}, {record.city} {record.pinCode}</p>
        </div>
        {user?.role === 'CUSTOMER' ? <Button variant="ghost" onClick={() => favorite.mutate()}>Save</Button> : null}
      </header>
      <ShopMap shop={record} />
      <form onSubmit={(event) => { event.preventDefault(); setQ(event.target.q.value) }}>
        <TextInput name="q" placeholder={`Search ${record.name}`} aria-label={`Search ${record.name}`} />
      </form>
      <div className="flex gap-2 overflow-auto">
        <button type="button" className={`rounded-lg border px-3 py-2 text-sm ${!category ? 'border-ink' : 'border-line'}`} onClick={() => setCategory('')}>All</button>
        {(record.categories || []).map((item) => (
          <button key={item._id} type="button" className={`rounded-lg border px-3 py-2 text-sm ${category === item._id ? 'border-ink' : 'border-line'}`} onClick={() => setCategory(item._id)}>{item.name}</button>
        ))}
      </div>
      <div className="grid gap-3">
        {(products.data?.products || []).map((product) => <ProductCard key={product._id} product={product} />)}
      </div>
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
