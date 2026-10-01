import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { shopApi } from '../../services'
import { useLocationSelection } from '../../context/LocationContext'
import { usePageMeta } from '../../hooks/usePageMeta'
import ProductCard from '../../components/ProductCard'
import ShopCard from '../../components/ShopCard'
import EmptyState from '../../components/ui/EmptyState'
import { formatDistance } from '../../lib/format'
import { TextInput } from '../../components/ui/Field'

export default function SearchPage() {
  usePageMeta('Search · NEARE')
  const [params, setParams] = useSearchParams()
  const { location } = useLocationSelection()
  const q = params.get('q') || ''
  const results = useQuery({
    queryKey: ['search', q, location?.coordinates, params.toString()],
    queryFn: () => shopApi.search({
      q,
      longitude: location.coordinates[0],
      latitude: location.coordinates[1],
      open: params.get('open') || undefined,
      pickup: params.get('pickup') || undefined,
      delivery: params.get('delivery') || undefined,
      minPrice: params.get('minPrice') || undefined,
      maxPrice: params.get('maxPrice') || undefined,
      category: params.get('category') || undefined,
    }),
    enabled: Boolean(q && location?.coordinates),
  })

  function setParam(key, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next)
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Search</h1>
      <form className="mt-4" onSubmit={(event) => { event.preventDefault(); setParam('q', event.target.q.value) }}>
        <TextInput name="q" defaultValue={q} placeholder="Search products, shops, or categories" aria-label="Search" />
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {[['open', 'Open now'], ['pickup', 'Pickup'], ['delivery', 'Delivery']].map(([key, label]) => (
          <button key={key} type="button" className={`rounded-lg border px-3 py-2 text-sm ${params.get(key) ? 'border-ink bg-ink text-white' : 'border-line bg-white'}`} onClick={() => setParam(key, params.get(key) ? '' : 'true')}>{label}</button>
        ))}
        <TextInput className="max-w-28" inputMode="numeric" placeholder="Min ₹" aria-label="Minimum price" defaultValue={params.get('minPrice') || ''} onBlur={(event) => setParam('minPrice', event.target.value)} />
        <TextInput className="max-w-28" inputMode="numeric" placeholder="Max ₹" aria-label="Maximum price" defaultValue={params.get('maxPrice') || ''} onBlur={(event) => setParam('maxPrice', event.target.value)} />
      </div>
      {!location ? <div className="mt-6"><EmptyState title="Set a location" body="Search uses your shopping location to rank nearby results." /></div> : null}
      {!q ? <div className="mt-6"><EmptyState title="Search NEARE" body="Try milk, bread, or a shop name." /></div> : null}
      {results.isError ? <div className="mt-6"><EmptyState title="Search failed" body={results.error.message} /></div> : null}
      {q && results.data && !results.data.products.length && !results.data.shops.length ? <div className="mt-6"><EmptyState title="No matches" body="No shop or product matched that search." /></div> : null}
      {results.data?.products?.length ? (
        <section className="mt-6 space-y-3">
          <h2 className="font-semibold">{q}</h2>
          {results.data.products.map((row) => (
            <ProductCard key={row.product._id} product={row.product} shop={row.shop} distance={formatDistance(row.distance)} />
          ))}
        </section>
      ) : null}
      {results.data?.shops?.length ? (
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          {results.data.shops.map((row) => <ShopCard key={row.shop._id} shop={row.shop} distance={row.distance} />)}
        </section>
      ) : null}
    </div>
  )
}
