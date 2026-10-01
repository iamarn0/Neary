import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin } from 'lucide-react'
import { orderApi, shopApi } from '../../services'
import { useLocationSelection } from '../../context/LocationContext'
import { useGeolocation } from '../../hooks/useGeolocation'
import { usePageMeta } from '../../hooks/usePageMeta'
import ShopCard from '../../components/ShopCard'
import ProductCard from '../../components/ProductCard'
import Map from '../../components/maps/Map'
import { formatINR, formatStatus, greeting } from '../../lib/format'
import { useAuth } from '../../context/AuthContext'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { TextInput } from '../../components/ui/Field'

const ACTIVE = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY']

export default function HomePage() {
  usePageMeta('NEARE — Everything You Need, Near You', 'Discover nearby local shops and order for pickup or delivery.')
  const navigate = useNavigate()
  const { user } = useAuth()
  const { location, setLocation, openPicker } = useLocationSelection()
  const geo = useGeolocation()
  const asked = useRef(false)
  const [q, setQ] = useState('')
  const categories = useQuery({ queryKey: ['categories'], queryFn: shopApi.categories, staleTime: 5 * 60 * 1000 })
  const orders = useQuery({ queryKey: ['orders'], queryFn: orderApi.list })
  const shops = useQuery({
    queryKey: ['nearby', location?.coordinates],
    queryFn: () => shopApi.nearby({
      longitude: location.coordinates[0],
      latitude: location.coordinates[1],
      radius: 12000,
      limit: 8,
    }),
    enabled: Boolean(location?.coordinates),
  })
  const popular = useQuery({
    queryKey: ['nearby-products', location?.coordinates],
    queryFn: () => shopApi.nearbyProducts({
      longitude: location.coordinates[0],
      latitude: location.coordinates[1],
      radius: 12000,
      limit: 8,
    }),
    enabled: Boolean(location?.coordinates),
  })

  useEffect(() => {
    if (!asked.current || geo.status !== 'allowed' || !geo.coordinates) return
    asked.current = false
    setLocation({ label: 'Current location', coordinates: geo.coordinates, area: '', city: '' })
  }, [geo.status, geo.coordinates, setLocation])

  const active = (orders.data?.orders || []).find((order) => ACTIVE.includes(order.orderStatus))
  const firstName = user?.name?.split(' ')[0]
  const picks = (categories.data?.categories || []).slice(0, 6)

  return (
    <div className="space-y-12">
      <section>
        <p className="text-sm text-muted">{greeting()}{firstName ? `, ${firstName}` : ''}</p>
        <p className="mt-4 text-sm text-muted">Delivering to</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {location?.label || 'Choose a location'}
          </h1>
          <button type="button" onClick={openPicker} className="text-sm text-info">
            {location ? 'Change location' : 'Set location'}
          </button>
        </div>
        {!location ? (
          <div className="mt-4">
            <button type="button" onClick={() => { asked.current = true; geo.request() }} className="inline-flex items-center gap-2 border border-ink bg-ink px-4 py-2 text-sm text-white">
              <MapPin size={14} aria-hidden="true" />
              {geo.status === 'loading' ? 'Finding location…' : 'Use current location'}
            </button>
            {geo.status === 'denied' || geo.status === 'unavailable' || geo.status === 'unsupported' ? (
              <p className="mt-3 text-sm text-muted">Location is unavailable. Search your area instead.</p>
            ) : null}
          </div>
        ) : null}
        <form
          className="mt-6 max-w-2xl"
          onSubmit={(event) => {
            event.preventDefault()
            if (!q.trim()) return
            navigate(`/explore?q=${encodeURIComponent(q.trim())}`)
          }}
        >
          <label className="sr-only" htmlFor="home-search">Search products, shops and categories</label>
          <TextInput id="home-search" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search products, shops & categories" />
        </form>
      </section>

      <section>
        <h2 className="text-sm font-medium text-muted">Quick picks</h2>
        <div className="mt-3 flex gap-2 overflow-auto pb-1">
          {picks.map((category) => (
            <Link key={category._id} to={`/explore?category=${category._id}`} className="shrink-0 border border-line bg-white px-4 py-2 text-sm hover:border-ink">
              {category.name}
            </Link>
          ))}
          <Link to="/explore" className="shrink-0 border border-line bg-white px-4 py-2 text-sm text-muted hover:border-ink">More</Link>
        </div>
      </section>

      {active ? (
        <section className="border border-line bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Active order</p>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">{active.shop?.name}</h2>
              <p className="mt-1 text-sm">
                <span className={active.orderStatus === 'OUT_FOR_DELIVERY' ? 'text-success' : 'text-ink'}>{formatStatus(active.orderStatus)}</span>
                {active.orderStatus === 'OUT_FOR_DELIVERY' && active.etaMax ? <span className="text-muted"> · Arriving in ~{active.etaMax} min</span> : null}
              </p>
            </div>
            <p className="text-sm font-medium">{formatINR(active.total)}</p>
          </div>
          <div className="mt-4">
            {active.fulfillmentMethod === 'DELIVERY' ? (
              <Link to={`/orders/${active._id}/track`}><Button>Track order</Button></Link>
            ) : (
              <Link to={`/orders/${active._id}`}><Button>View pickup</Button></Link>
            )}
          </div>
        </section>
      ) : (
        <section className="border border-line bg-white px-5 py-6">
          <h2 className="text-lg font-semibold">Find something nearby</h2>
          <p className="mt-1 text-sm text-muted">Explore shops around you.</p>
          <Link to="/explore" className="mt-4 inline-block"><Button>Explore nearby</Button></Link>
        </section>
      )}

      <section>
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">Nearby shops</h2>
          <Link to="/explore" className="text-sm text-info">See all</Link>
        </div>
        {!location ? (
          <div className="mt-4"><EmptyState title="Set a shopping location" body="Nearby shops are based on where you are ordering from." action={<Button onClick={openPicker}>Choose location</Button>} /></div>
        ) : shops.isLoading ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        ) : shops.isError ? (
          <div className="mt-4"><EmptyState title="We couldn't load nearby shops." body="Check your connection and try again." action={<Button onClick={() => shops.refetch()}>Try again</Button>} /></div>
        ) : shops.data?.shops?.length ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shops.data.shops.map((row) => <ShopCard key={row.shop._id} shop={row.shop} distance={row.distance} />)}
          </div>
        ) : (
          <div className="mt-4"><EmptyState title="No shops nearby" body="Try another area." action={<Button onClick={openPicker}>Change location</Button>} /></div>
        )}
      </section>

      {location && (popular.isLoading || popular.data?.products?.length) ? (
        <section>
          <h2 className="text-lg font-semibold">{popular.data?.rankedBy === 'orders' ? 'Popular near you' : 'Available nearby'}</h2>
          <p className="mt-1 text-sm text-muted">
            {popular.data?.rankedBy === 'orders' ? 'Ranked by orders at nearby shops, then distance.' : 'In stock at shops around this location.'}
          </p>
          {popular.isLoading ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2"><SkeletonCard /><SkeletonCard /></div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {popular.data.products.map((row) => (
                <ProductCard key={row.product._id} product={row.product} shop={row.shop} distance={row.distance} />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {location?.coordinates ? (
        <section>
          <h2 className="text-lg font-semibold">Explore your neighborhood</h2>
          <p className="mt-1 text-sm text-muted">Shops within your current delivery area.</p>
          <Map
            className="mt-4 h-72 sm:h-96"
            center={location.coordinates}
            zoom={13}
            markers={(shops.data?.shops || []).slice(0, 8).map((row) => ({
              coordinates: row.shop.location?.coordinates,
              label: row.shop.name,
              color: '#111827',
              ariaLabel: row.shop.name,
            }))}
          />
        </section>
      ) : null}
    </div>
  )
}
