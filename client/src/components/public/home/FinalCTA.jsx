import { Cta, frame, Reveal, useHomeLinks } from './homeUi'

export default function FinalCTA() {
  const { explore } = useHomeLinks()

  return (
    <section className="bg-ink text-white">
      <div className={`${frame} py-16 lg:py-24`}>
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">Start here</p>
          <h2 className="font-display mt-4 max-w-3xl text-4xl leading-[1.02] tracking-tight sm:text-6xl">
            What's nearby is closer than you think.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/70">
            Discover local shops, order what you need, and make your neighborhood your marketplace.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Cta to={explore.to} state={explore.state} arrow>Explore nearby</Cta>
            <Cta to="/for-shops" variant="inverse">Become a shop partner</Cta>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
