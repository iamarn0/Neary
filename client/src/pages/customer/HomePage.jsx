import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin } from 'lucide-react'
import { orderApi, shopApi } from '../../services'
import { useLocationSelection } from '../../context/LocationContext'
import { useGeolocation } from '../../hooks/useGeolocation'
import { usePageMeta } from '../../hooks/usePageMeta'
import ShopCard from '../../components/ShopCard'
import Map from '../../components/maps/Map'
import { formatINR, formatStatus, greeting } from '../../lib/format'
import { useAuth } from '../../context/AuthContext'
import CategoryCard from '../../components/CategoryCard'
import OrderTimeline from '../../components/OrderTimeline'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { TextInput } from '../../components/ui/Field'

const ACTIVE = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY']

const neighbourhoods = [
  { label: 'Salt Lake, Kolkata', area: 'Salt Lake', city: 'Kolkata', state: 'West Bengal', coordinates: [88.4103, 22.5801] },
  { label: 'Lake Town, Kolkata', area: 'Lake Town', city: 'Kolkata', state: 'West Bengal', coordinates: [88.402, 22.6018] },
  { label: 'New Town, Kolkata', area: 'New Town', city: 'Kolkata', state: 'West Bengal', coordinates: [88.481, 22.5892] },
  { label: 'Park Street, Kolkata', area: 'Park Street', city: 'Kolkata', state: 'West Bengal', coordinates: [88.3514, 22.554] },
  { label: 'Ballygunge, Kolkata', area: 'Ballygunge', city: 'Kolkata', state: 'West Bengal', coordinates: [88.3654, 22.528] },
  { label: 'Jadavpur, Kolkata', area: 'Jadavpur', city: 'Kolkata', state: 'West Bengal', coordinates: [88.3714, 22.4955] },
]

export default function HomePage() {
  usePageMeta('NEARE — Everything You Need, Near You', 'Discover nearby local shops and order for pickup or delivery.')
  const navigate = useNavigate()
  const { user } = useAuth()
  const { location, setLocation } = useLocationSelection()
  const geo = useGeolocation()
  const [q, setQ] = useState('')
  const categories = useQuery({ queryKey: ['categories'], queryFn: shopApi.categories })
  const orders = useQuery({ queryKey: ['orders'], queryFn: orderApi.list })
  const shops = useQuery({
    queryKey: ['nearby', location?.coordinates],
    queryFn: () => shopApi.nearby({
      longitude: location.coordinates[0],
      latitude: location.coordinates[1],
      radius: 12000,
    }),
    enabled: Boolean(location?.coordinates),
  })

  useEffect(() => {
    if (geo.status === 'allowed' && geo.coordinates) {
      setLocation({ label: 'Current location', coordinates: geo.coordinates, area: '', city: '' })
    }
  }, [geo.status, geo.coordinates, setLocation])

  function useCurrent() {
    geo.request()
  }

  return (
    <div className="space-y-10">
      <section>
        <p className="text-sm text-muted">{greeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
          {location?.label ? `Delivering to ${location.label}` : 'Where are you shopping from?'}
        </h1>
        <p className="mt-2 text-muted">Everything you need, near you.</p>
        <form
          className="mt-6 max-w-2xl"
          onSubmit={(event) => {
            event.preventDefault()
            if (!q.trim()) return
            navigate(`/search?q=${encodeURIComponent(q.trim())}`)
          }}
        >
          <label className="sr-only" htmlFor="home-search">Search products, shops, or categories</label>
          <TextInput id="home-search" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search products, shops, or categories" />
        </form>
        {!location ? (
          <div className="mt-5">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={useCurrent} className="inline-flex items-center gap-2 rounded-full border border-ink bg-ink px-4 py-2 text-sm text-white">
                <MapPin size={14} aria-hidden="true" />
                {geo.status === 'loading' ? 'Finding location…' : 'Use my current location'}
              </button>
              {neighbourhoods.map((place) => (
                <button
                  key={place.label}
                  type="button"
                  onClick={() => setLocation(place)}
                  className="rounded-full border border-line bg-white px-4 py-2 text-sm hover:border-ink"
                >
                  {place.area}
                </button>
              ))}
            </div>
            {geo.status === 'denied' || geo.status === 'unavailable' ? (
              <p className="mt-3 text-sm text-muted">Location permission was not available. Choose a neighbourhood instead.</p>
            ) : null}
          </div>
        ) : null}
      </section>

      {(() => {
        const active = (orders.data?.orders || []).find((order) => ACTIVE.includes(order.orderStatus))
        if (!active) return null
        const steps = active.fulfillmentMethod === 'PICKUP'
          ? ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP']
          : ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED']
        return (
          <section className="rounded-2xl border border-line bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Your order</p>
            <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{active.shop?.name}</h2>
                <p className="text-sm text-muted">{formatStatus(active.orderStatus)} · {active.orderNumber}</p>
              </div>
              <p className="text-sm font-medium">{formatINR(active.total)}</p>
            </div>
            <div className="mt-4">
              <OrderTimeline steps={steps} status={active.orderStatus} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {active.fulfillmentMethod === 'DELIVERY' ? (
                <Link to={`/orders/${active._id}/track`}><Button>Track order</Button></Link>
              ) : (
                <Link to={`/orders/${active._id}`}><Button>View pickup</Button></Link>
              )}
            </div>
          </section>
        )
      })()}

      <section>
        <h2 className="text-lg font-semibold">Categories</h2>
        <div className="mt-3 flex gap-2 overflow-auto pb-1">
          {(categories.data?.categories || []).map((category) => <CategoryCard key={category._id} category={category} />)}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Nearby shops</h2>
          <Link to="/explore" className="text-sm text-info">See all</Link>
        </div>
        {!location ? (
          <div className="mt-4"><EmptyState title="Choose a neighbourhood" body="Salt Lake is the demo area. FreshMart and Daily Basket are the closest shops." /></div>
        ) : shops.isLoading ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        ) : shops.isError ? (
          <div className="mt-4"><EmptyState title="Unable to load shops" body={shops.error.message} /></div>
        ) : shops.data?.shops?.length ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-[280px_1fr]">
            <Map
              className="h-64 lg:h-full lg:min-h-80"
              center={location.coordinates}
              zoom={12}
              markers={shops.data.shops.slice(0, 8).map((row) => ({
                coordinates: row.shop.location?.coordinates,
                label: row.shop.name,
                color: '#111827',
                ariaLabel: row.shop.name,
              }))}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {shops.data.shops.map((row) => <ShopCard key={row.shop._id} shop={row.shop} distance={row.distance} />)}
            </div>
          </div>
        ) : (
          <div className="mt-4"><EmptyState title="No shops nearby" body="Try expanding your search area." /></div>
        )}
      </section>
    </div>
  )
}
