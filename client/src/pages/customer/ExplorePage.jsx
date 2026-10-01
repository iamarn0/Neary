import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { shopApi } from '../../services'
import { useLocationSelection } from '../../context/LocationContext'
import { usePageMeta } from '../../hooks/usePageMeta'
import Media from '../../components/Media'
import Map from '../../components/maps/Map'
import Rating from '../../components/ui/Rating'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonList } from '../../components/ui/Skeleton'
import { formatDistance } from '../../lib/format'

const neighbourhoods = [
  { label: 'Salt Lake, Kolkata', area: 'Salt Lake', city: 'Kolkata', state: 'West Bengal', coordinates: [88.4103, 22.5801] },
  { label: 'Lake Town, Kolkata', area: 'Lake Town', city: 'Kolkata', state: 'West Bengal', coordinates: [88.402, 22.6018] },
  { label: 'New Town, Kolkata', area: 'New Town', city: 'Kolkata', state: 'West Bengal', coordinates: [88.481, 22.5892] },
  { label: 'Park Street, Kolkata', area: 'Park Street', city: 'Kolkata', state: 'West Bengal', coordinates: [88.3514, 22.554] },
]

export default function ExplorePage() {
  usePageMeta('Explore shops · NEARE')
  const [params, setParams] = useSearchParams()
  const { location, setLocation } = useLocationSelection()
  const [selected, setSelected] = useState(null)
  const listRef = useRef(null)
  const category = params.get('category') || ''
  const open = params.get('open') || ''
  const pickup = params.get('pickup') || ''
  const delivery = params.get('delivery') || ''
  const categories = useQuery({ queryKey: ['categories'], queryFn: shopApi.categories })
  const shops = useQuery({
    queryKey: ['explore', location?.coordinates, category, open, pickup, delivery],
    queryFn: () => shopApi.nearby({
      longitude: location.coordinates[0],
      latitude: location.coordinates[1],
      radius: 15000,
      category: category || undefined,
      open: open || undefined,
      pickup: pickup || undefined,
      delivery: delivery || undefined,
    }),
    enabled: Boolean(location?.coordinates),
  })

  function toggle(key) {
    const next = new URLSearchParams(params)
    if (next.get(key)) next.delete(key)
    else next.set(key, 'true')
    setParams(next)
  }

  const rows = shops.data?.shops || []
  const focus = location?.coordinates

  function choose(id) {
    setSelected(id)
    const card = listRef.current?.querySelector(`[data-shop="${id}"]`)
    card?.scrollIntoView({ block: 'nearest' })
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Explore</h1>
      <p className="mt-1 text-sm text-muted">Shops on the map are the same ones in the list, sorted by distance.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <select className="rounded-lg border border-line bg-white px-3 py-2 text-sm" value={category} onChange={(event) => {
          const next = new URLSearchParams(params)
          if (event.target.value) next.set('category', event.target.value)
          else next.delete('category')
          setParams(next)
        }} aria-label="Category">
          <option value="">All categories</option>
          {(categories.data?.categories || []).map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
        </select>
        {[['open', 'Open now'], ['pickup', 'Pickup'], ['delivery', 'Delivery']].map(([key, label]) => (
          <button key={key} type="button" onClick={() => toggle(key)} className={`rounded-lg border px-3 py-2 text-sm ${params.get(key) ? 'border-ink bg-ink text-white' : 'border-line bg-white'}`}>
            {label}
          </button>
        ))}
      </div>
      {!location ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {neighbourhoods.map((place) => (
            <button key={place.label} type="button" onClick={() => setLocation(place)} className="rounded-full border border-line bg-white px-4 py-2 text-sm">
              {place.area}
            </button>
          ))}
        </div>
      ) : null}
      {!location ? <div className="mt-6"><EmptyState title="Choose a neighbourhood" body="The map and shop list use the same location." /></div> : null}
      {location && shops.isLoading ? <div className="mt-6"><SkeletonList count={5} /></div> : null}
      {location && shops.isError ? <div className="mt-6"><EmptyState title="We couldn't load nearby shops." body={shops.error.message} /></div> : null}
      {rows.length ? (
        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
          <Map
            className="h-80 sm:h-[32rem] lg:sticky lg:top-20"
            center={focus}
            zoom={12}
            fit
            fitKey={rows.map((row) => row.shop._id).join(',')}
            label="Nearby shops"
            markers={rows.map((row, index) => ({
              coordinates: row.shop.location?.coordinates,
              label: row.shop.name,
              index: index + 1,
              variant: 'index',
              active: row.shop._id === selected,
              color: row.shop._id === selected ? '#E85D04' : '#111827',
              ariaLabel: `${index + 1}. ${row.shop.name}`,
              onClick: () => choose(row.shop._id),
            }))}
          />
          <div ref={listRef} className="grid max-h-[32rem] content-start gap-2 overflow-auto">
            {rows.map((row, index) => {
              const active = row.shop._id === selected
              return (
                <Link
                  key={row.shop._id}
                  to={`/shops/${row.shop._id}`}
                  data-shop={row.shop._id}
                  onMouseEnter={() => setSelected(row.shop._id)}
                  onFocus={() => setSelected(row.shop._id)}
                  className={`flex gap-3 rounded-xl border bg-white p-2.5 ${active ? 'border-ink' : 'border-line'}`}
                >
                  <Media src={row.shop.logo || row.shop.coverImage} alt="" className="h-16 w-16 shrink-0 rounded-lg" />
                  <span className="min-w-0 py-0.5">
                    <span className="flex items-start justify-between gap-2">
                      <span className="font-medium">{index + 1}. {row.shop.name}</span>
                      {row.shop.reviewCount > 0 ? <Rating value={row.shop.rating} /> : <span className="shrink-0 text-xs text-muted">New</span>}
                    </span>
                    <span className="mt-1 block text-sm text-muted">{formatDistance(row.distance)} · {row.shop.city}</span>
                    <span className="mt-1 block text-sm">
                      <span className={row.shop.isOpen ? 'text-success' : 'text-muted'}>{row.shop.isOpen ? 'Open' : 'Closed'}</span>
                      {row.shop.deliveryAvailable ? <span className="text-muted"> · Delivery {row.shop.prepTimeMin}–{row.shop.prepTimeMax} min</span> : null}
                      {row.shop.pickupAvailable ? <span className="text-muted"> · Pickup</span> : null}
                    </span>
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      ) : null}
      {location && shops.data && !rows.length ? <div className="mt-6"><EmptyState title="No shops nearby" body="Try expanding your search area or clearing a filter." /></div> : null}
    </div>
  )
}