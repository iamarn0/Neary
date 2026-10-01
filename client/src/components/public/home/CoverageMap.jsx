import Map from '../../maps/Map'
import {
  coverageMarkers,
  formatKm,
  nearbyRadiusKm,
  shopsWithinRadius,
  YOU,
} from './homeData'
import { frame, Reveal } from './homeUi'

export default function CoverageMap() {
  const open = shopsWithinRadius.filter((shop) => shop.open).length
  const delivery = shopsWithinRadius.filter((shop) => shop.delivery).length

  return (
    <section className="bg-canvas" aria-labelledby="coverage-heading">
      <div className={`${frame} py-16 lg:py-20`}>
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Coverage</p>
          <h2 id="coverage-heading" className="font-display mt-3 max-w-xl text-4xl leading-[1.05] tracking-tight sm:text-5xl">
            Your neighborhood, mapped.
          </h2>
          <p className="mt-3 max-w-lg text-muted">NEARE brings nearby shops into one place.</p>
        </Reveal>
        <div className="relative mt-8 min-w-0">
          <div className="min-w-0 overflow-hidden border border-line bg-[#E7E4DE]">
            <Map
              bare
              className="h-[420px] sm:h-[520px]"
              center={YOU}
              zoom={12.7}
              radiusKm={nearbyRadiusKm}
              radiusCenter={YOU}
              markers={coverageMarkers}
              label="Demo map of NEARE shops in Kolkata"
            />
          </div>
          <aside className="mt-3 border border-line bg-white p-4 sm:p-5 lg:absolute lg:left-4 lg:top-4 lg:mt-0 lg:w-64">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Demo map · Salt Lake</p>
            <p className="font-display mt-2 text-5xl leading-none tracking-tight">{shopsWithinRadius.length}</p>
            <p className="mt-1 text-sm">shops within {nearbyRadiusKm} km</p>
            <ul className="mt-4 space-y-1 text-sm text-muted">
              <li>{open} open now</li>
              <li>{delivery} offer delivery</li>
            </ul>
            <ul className="mt-4 divide-y divide-line border-t border-line">
              {shopsWithinRadius.map((shop) => (
                <li key={shop.name} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span>
                    <span className="font-medium text-ink">{shop.name}</span>
                    <span className="mt-0.5 block text-xs text-muted">{shop.category}</span>
                  </span>
                  <span className="text-muted">{formatKm(shop.km)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-5 text-muted">Zoom out for the rest of the demo city. This pin is not your location.</p>
          </aside>
        </div>
      </div>
    </section>
  )
}
