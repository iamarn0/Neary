import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { shopApi } from '../../services'
import { useLocationSelection } from '../../context/LocationContext'
import { usePageMeta } from '../../hooks/usePageMeta'
import ShopCard from '../../components/ShopCard'
import ProductCard from '../../components/ProductCard'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'

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
      {!favorites.isLoading && !favorites.data?.shops?.length && !favorites.data?.products?.length ? (
        <div className="mt-6">
          <EmptyState title="Save shops and products you want to find again." body="Hearts on a shop or product stay on this page." action={<Link to="/explore"><Button>Explore nearby</Button></Link>} />
        </div>
      ) : (
        <>
          <h2 className="mt-6 font-semibold">Shops</h2>
          {favorites.data?.shops?.length ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.data.shops.map((row) => <ShopCard key={row.shop._id} shop={row.shop} distance={row.distance} />)}
            </div>
          ) : <p className="mt-3 text-sm text-muted">No saved shops yet.</p>}
          <h2 className="mt-8 font-semibold">Products</h2>
          {favorites.data?.products?.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {favorites.data.products.map((product) => <ProductCard key={product._id} product={product} shop={product.shop} />)}
            </div>
          ) : <p className="mt-3 text-sm text-muted">No saved products yet.</p>}
        </>
      )}
    </div>
  )
}
