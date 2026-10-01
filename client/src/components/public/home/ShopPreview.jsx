import { previewShops } from './homeData'
import { Cta, frame, Reveal, useHomeLinks } from './homeUi'
import ShopCard from './ShopCard'

export default function ShopPreview() {
  const { explore } = useHomeLinks()

  return (
    <section className="border-y border-line bg-white" aria-labelledby="shops-around">
      <div className={`${frame} py-16 lg:py-20`}>
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Marketplace</p>
            <h2 id="shops-around" className="font-display mt-3 text-4xl leading-none tracking-tight sm:text-5xl">Shops around you</h2>
            <p className="mt-3 text-muted">Local businesses, ready when you are.</p>
          </div>
          <Cta to={explore.to} state={explore.state} variant="ghost" arrow>Explore all shops</Cta>
        </Reveal>
        <ul className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible xl:grid-cols-3" aria-label="Demo shops near Salt Lake">
          {previewShops.map((shop) => (
            <li key={shop.name} className="contents md:block">
              <ShopCard shop={shop} />
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted">Distances are from a demo pin in Salt Lake, not your device location.</p>
      </div>
    </section>
  )
}
