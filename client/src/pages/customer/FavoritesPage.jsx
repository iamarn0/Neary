import { useQuery } from '@tanstack/react-query'
import { shopApi } from '../../services'
import { useLocationSelection } from '../../context/LocationContext'
import { usePageMeta } from '../../hooks/usePageMeta'
import ShopCard from '../../components/ShopCard'
import ProductCard from '../../components/ProductCard'
import EmptyState from '../../components/ui/EmptyState'

export default function FavoritesPage() {
  usePageMeta('Favorites · NEARE')
  const { location } = useLocationSelection()
  const favorites = useQuery({
    queryKey: ['favorites', location?.coordinates],
    queryFn: () => shopApi.favorites({
      longitude: location?.coordinates?.[0],
      latitude: location?.coordinates?.[1],
    }),
  })
  return (
    <div>
      <h1 className="text-2xl font-semibold">Favorites</h1>
      <p className="mt-1 text-sm text-muted">Save shops and products you want to find again.</p>
      <h2 className="mt-6 font-semibold">Shops</h2>
      {favorites.data?.shops?.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.data.shops.map((row) => <ShopCard key={row.shop._id} shop={row.shop} distance={row.distance} />)}
        </div>
      ) : <div className="mt-4"><EmptyState title="No favorite shops yet" body="Save a shop from its page to find it faster." /></div>}
      <h2 className="mt-8 font-semibold">Products</h2>
      {favorites.data?.products?.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {favorites.data.products.map((product) => <ProductCard key={product._id} product={product} shop={product.shop} />)}
        </div>
      ) : <div className="mt-4"><EmptyState title="No favorite products yet" body="Save a product from its page." /></div>}
    </div>
  )
}
