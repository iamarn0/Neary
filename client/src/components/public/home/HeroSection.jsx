import { Cta, frame, Reveal, useHomeLinks } from './homeUi'
import HeroMarketplacePreview from './HeroMarketplacePreview'
import SearchPreview from './SearchPreview'

export default function HeroSection() {
  const { explore } = useHomeLinks()

  return (
    <section className="border-b border-line">
      <div className={`${frame} grid items-center gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12 lg:py-16`}>
        <Reveal>
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink">
            <span className="h-px w-8 bg-brand" aria-hidden="true" />
            Your neighborhood, online
          </p>
          <h1 className="font-display mt-4 text-[clamp(2rem,4.4vw,4.5rem)] leading-[0.96] tracking-[-0.03em] text-ink">
            <span className="block">Everything you need,</span>
            <span className="mt-1 block italic">near you.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-muted sm:text-lg">
            Discover nearby shops, order what you need, and choose pickup or local delivery — all in one place.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Cta to={explore.to} state={explore.state} arrow>Explore nearby</Cta>
            <Cta to="/for-shops" variant="ghost">Become a shop partner</Cta>
          </div>
          <p className="mt-5 text-xs font-medium tracking-wide text-muted">Local shops · Pickup · Delivery · ₹</p>
        </Reveal>
        <HeroMarketplacePreview />
      </div>
      <div className={`${frame} pb-10 lg:pb-14`}>
        <SearchPreview />
      </div>
    </section>
  )
}
