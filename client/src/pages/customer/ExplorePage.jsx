import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { shopApi } from '../../services'
import { useLocationSelection } from '../../context/LocationContext'
import { usePageMeta } from '../../hooks/usePageMeta'
import Media from '../../components/Media'
import Map from '../../components/maps/Map'
import ProductCard from '../../components/ProductCard'
import Rating from '../../components/ui/Rating'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import Pagination from '../../components/ui/Pagination'
import { SkeletonList } from '../../components/ui/Skeleton'
import { TextInput } from '../../components/ui/Field'
import { formatDistance } from '../../lib/format'

export default function ExplorePage() {
  usePageMeta('Explore · NEARE')
  const [params, setParams] = useSearchParams()
  const { location, openPicker } = useLocationSelection()
  const [selected, setSelected] = useState(null)
  const [draft, setDraft] = useState(params.get('q') || '')
  const [suggestOpen, setSuggestOpen] = useState(false)
  const listRef = useRef(null)
  const category = params.get('category') || ''
  const open = params.get('open') || ''
  const pickup = params.get('pickup') || ''
  const delivery = params.get('delivery') || ''
  const sort = params.get('sort') || 'relevance'
  const page = Number(params.get('page') || 1)
  const q = params.get('q') || ''
  const tab = params.get('tab') === 'shops' ? 'shops' : 'products'

  useEffect(() => {
    setDraft(q)
  }, [q])

  useEffect(() => {
    const handle = setTimeout(() => {
      const next = draft.trim()
      setParams((current) => {
        if ((current.get('q') || '') === next) return current
        const copy = new URLSearchParams(current)
        if (next) copy.set('q', next)
        else copy.delete('q')
        copy.delete('page')
        return copy
      }, { replace: true })
    }, 300)
    return () => clearTimeout(handle)
  }, [draft, setParams])

  const categories = useQuery({ queryKey: ['categories'], queryFn: shopApi.categories, staleTime: 5 * 60 * 1000 })
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
    enabled: Boolean(location?.coordinates) && !q,
  })
  const results = useQuery({
    queryKey: ['search', q, location?.coordinates, category, open, pickup, delivery, sort, page],
    queryFn: () => shopApi.search({
      q,
      longitude: location.coordinates[0],
      latitude: location.coordinates[1],
      category: category || undefined,
      open: open || undefined,
      pickup: pickup || undefined,
      delivery: delivery || undefined,
      sort,
      page,
      limit: 12,
    }),
    enabled: Boolean(location?.coordinates && q),
  })

  function setParam(key, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }

  function toggle(key) {
    setParam(key, params.get(key) ? '' : 'true')
  }

  const rows = shops.data?.shops || []
  const suggestions = results.data?.suggestions || []

  function choose(id) {
    setSelected(id)
    listRef.current?.querySelector(`[data-shop="${id}"]`)?.scrollIntoView({ block: 'nearest' })
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Explore</h1>
      <p className="mt-1 text-sm text-muted">
        {location?.label ? `Shopping from ${location.label}.` : 'Set a location to see nearby shops and products.'}
      </p>
      <div className="relative mt-4 max-w-2xl">
        <label className="sr-only" htmlFor="explore-search">Search products, shops and categories</label>
        <TextInput
          id="explore-search"
          value={draft}
          placeholder="Search products, shops & categories"
          autoComplete="off"
          onChange={(event) => { setDraft(event.target.value); setSuggestOpen(true) }}
          onFocus={() => setSuggestOpen(true)}
          onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
        />
        {suggestOpen && q && suggestions.length ? (
          <ul className="absolute z-10 mt-1 w-full border border-line bg-white shadow-sm">
            {suggestions.map((label) => (
              <li key={label}>
                <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-canvas" onMouseDown={() => { setDraft(label); setSuggestOpen(false) }}>
                  {label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <select className="border border-line bg-white px-3 py-2 text-sm" value={category} onChange={(event) => setParam('category', event.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {(categories.data?.categories || []).map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
        </select>
        {q ? (
          <select className="border border-line bg-white px-3 py-2 text-sm" value={sort} onChange={(event) => setParam('sort', event.target.value)} aria-label="Sort">
            <option value="relevance">Open, then distance</option>
            <option value="distance">Distance</option>
            <option value="price">Price</option>
          </select>
        ) : null}
        {[['open', 'Open now'], ['pickup', 'Pickup'], ['delivery', 'Delivery']].map(([key, label]) => (
          <button key={key} type="button" onClick={() => toggle(key)} className={`border px-3 py-2 text-sm ${params.get(key) ? 'border-ink bg-ink text-white' : 'border-line bg-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {!location ? (
        <div className="mt-6">
          <EmptyState title="Set a shopping location" body="Search uses your location for distance and open shops." action={<Button onClick={openPicker}>Choose location</Button>} />
        </div>
      ) : null}

      {location && q ? (
        <div className="mt-6">
          <div className="flex gap-4 border-b border-line text-sm">
            {[['products', 'Products'], ['shops', 'Shops']].map(([id, label]) => (
              <button key={id} type="button" className={`border-b-2 px-1 pb-2 ${tab === id ? 'border-ink font-medium' : 'border-transparent text-muted'}`} onClick={() => setParam('tab', id === 'products' ? '' : id)}>
                {label}
              </button>
            ))}
          </div>
          {results.isLoading ? <div className="mt-4"><SkeletonList count={4} /></div> : null}
          {results.isError ? (
            <div className="mt-4"><EmptyState title="We couldn't load search results." body="Try again in a moment." action={<Button onClick={() => results.refetch()}>Try again</Button>} /></div>
          ) : null}
          {results.data && tab === 'products' && !results.data.products.length ? (
            <div className="mt-4"><EmptyState title="No shops or products found nearby." body="Try another search or clear a filter." /></div>
          ) : null}
          {results.data && tab === 'shops' && !results.data.shops.length ? (
            <div className="mt-4"><EmptyState title="No shops found nearby." body="Try a product name, or another area." /></div>
          ) : null}
          {tab === 'products' && results.data?.products?.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {results.data.products.map((row) => (
                <ProductCard key={row.product._id} product={row.product} shop={row.shop} distance={row.distance} />
              ))}
            </div>
          ) : null}
          {tab === 'shops' && results.data?.shops?.length ? (
            <div className="mt-4 grid gap-3">
              {results.data.shops.map((row) => (
                <ShopRow key={row.shop._id} row={row} />
              ))}
            </div>
          ) : null}
          {tab === 'products' ? (
            <Pagination page={results.data?.pagination?.page || page} pages={results.data?.pagination?.pages || 1} onPage={(next) => setParam('page', String(next))} />
          ) : null}
        </div>
      ) : null}

      {location && !q && shops.isLoading ? <div className="mt-6"><SkeletonList count={5} /></div> : null}
      {location && !q && shops.isError ? (
        <div className="mt-6"><EmptyState title="We couldn't load nearby shops." body="Try again." action={<Button onClick={() => shops.refetch()}>Try again</Button>} /></div>
      ) : null}
      {location && !q && rows.length ? (
        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
          <Map
            className="h-80 sm:h-[32rem] lg:sticky lg:top-20"
            center={location.coordinates}
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
            {rows.map((row, index) => (
              <ShopRow key={row.shop._id} row={row} index={index + 1} active={row.shop._id === selected} onHover={() => setSelected(row.shop._id)} />
            ))}
          </div>
        </div>
      ) : null}
      {location && !q && shops.data && !rows.length ? <div className="mt-6"><EmptyState title="No shops nearby" body="Try another area or clear a filter." /></div> : null}
    </div>
  )
}

function ShopRow({ row, index, active, onHover }) {
  return (
    <Link
      to={`/shops/${row.shop._id}`}
      data-shop={row.shop._id}
      onMouseEnter={onHover}
      onFocus={onHover}
      className={`flex gap-3 border bg-white p-2.5 ${active ? 'border-ink' : 'border-line'}`}
    >
      <Media src={row.shop.logo || row.shop.coverImage} alt="" className="h-16 w-16 shrink-0" />
      <span className="min-w-0 py-0.5">
        <span className="flex items-start justify-between gap-2">
          <span className="font-medium">{index ? `${index}. ` : ''}{row.shop.name}</span>
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
}
