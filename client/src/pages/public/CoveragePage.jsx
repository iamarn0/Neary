import { Link } from 'react-router-dom'
import { usePageMeta } from '../../hooks/usePageMeta'
import PageHero from '../../components/public/PageHero'
import Map from '../../components/maps/Map'
import Button from '../../components/ui/Button'

const areas = [
  { area: 'Salt Lake', note: 'FreshMart and the shortest demo trips.', coordinates: [88.4103, 22.5801] },
  { area: 'Lake Town', note: 'Daily Basket, with pickup and delivery.', coordinates: [88.402, 22.6018] },
  { area: 'New Town', note: 'North-east of Salt Lake, inside a wider radius.', coordinates: [88.481, 22.5892] },
  { area: 'Park Street', note: 'Central Kolkata, farther from the Salt Lake cluster.', coordinates: [88.3514, 22.554] },
  { area: 'Ballygunge', note: 'Bake House and south Kolkata orders.', coordinates: [88.3654, 22.528] },
  { area: 'Jadavpur', note: 'South of Ballygunge, still inside the city radius.', coordinates: [88.3714, 22.4955] },
]

export default function CoveragePage() {
  usePageMeta('Coverage · NEARE', 'NEARE currently serves neighbourhoods across Kolkata.')

  return (
    <div>
      <PageHero
        eyebrow="Kolkata"
        title="Shops are ranked from where you stand."
        lede="NEARE is city-first. The first service area is Kolkata. Distance is measured from the neighbourhood you choose after sign-in."
      >
        <Link to="/login" state={{ from: '/home' }}><Button variant="brand">Shop in Kolkata</Button></Link>
      </PageHero>
      <section className="mx-auto grid max-w-6xl items-start gap-8 px-4 py-16 lg:grid-cols-[1fr_1fr]">
        <Map
          className="h-96"
          center={[88.39, 22.55]}
          zoom={11}
          markers={areas.map((place) => ({
            coordinates: place.coordinates,
            label: place.area,
            color: '#111827',
            ariaLabel: place.area,
          }))}
        />
        <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
          {areas.map((place) => (
            <li key={place.area} className="px-5 py-4">
              <p className="font-medium">{place.area}</p>
              <p className="mt-1 text-sm text-muted">{place.note}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
