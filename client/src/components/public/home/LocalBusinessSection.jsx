import Media from '../../Media'
import { localStories } from './homeData'
import { frame, Reveal } from './homeUi'

export default function LocalBusinessSection() {
  return (
    <section className="bg-canvas" aria-labelledby="local-shops">
      <div className={`${frame} py-16 lg:py-20`}>
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Local businesses</p>
          <h2 id="local-shops" className="font-display mt-3 max-w-3xl text-4xl leading-[1.05] tracking-tight sm:text-5xl">
            Built for the shops that already power your neighborhood.
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {localStories.map((shop) => (
            <article key={shop.name} className="border border-line bg-white">
              <Media src={shop.cover} alt={`${shop.name} in ${shop.area}`} loading="lazy" className="h-52 w-full" />
              <div className="p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{shop.category}</p>
                <h3 className="mt-2 text-xl font-semibold">{shop.name}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{shop.story}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
