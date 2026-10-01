import { Cta, frame, Reveal, useHomeLinks } from './homeUi'
import DashboardPreview from './DashboardPreview'

export default function BusinessSection() {
  const { user } = useHomeLinks()
  const partner = user?.role === 'SHOP_OWNER' ? { to: '/shop' } : { to: '/for-shops' }

  return (
    <section className="border-y border-line bg-white" aria-labelledby="shop-partners">
      <div className={`${frame} grid items-center gap-10 py-16 lg:grid-cols-2 lg:gap-16 lg:py-20`}>
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">For local shops</p>
          <h2 id="shop-partners" className="font-display mt-3 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
            Your shop deserves a bigger neighborhood.
          </h2>
          <p className="mt-4 max-w-md text-base leading-7 text-muted">
            Put your products in front of nearby customers and manage orders, inventory, pickup, and delivery from one place.
          </p>
          <div className="mt-7">
            <Cta to={partner.to} arrow>Become a shop partner</Cta>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <DashboardPreview />
          <p className="mt-3 text-xs text-muted">A sample desk, not live sales. The real one opens after a shop account is approved.</p>
        </Reveal>
      </div>
    </section>
  )
}
