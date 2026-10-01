import { useState } from 'react'
import { frame, Reveal } from './homeUi'

const modes = {
  pickup: {
    kicker: 'Pickup',
    title: 'Order ahead. Skip the wait.',
    steps: ['Shop', 'Ready for pickup', 'Customer arrives'],
  },
  delivery: {
    kicker: 'Delivery',
    title: "Stay home. We'll bring it.",
    steps: ['Shop', 'Delivery partner', 'Your door'],
  },
}

export default function FulfillmentSection() {
  const [mode, setMode] = useState('pickup')

  return (
    <section className="border-y border-line bg-white" aria-labelledby="fulfillment-heading">
      <div className={`${frame} py-16 lg:py-20`}>
        <Reveal>
          <h2 id="fulfillment-heading" className="font-display max-w-xl text-4xl leading-[1.05] tracking-tight sm:text-5xl">
            Pickup or delivery. Same shop.
          </h2>
        </Reveal>
        <div className="mt-8 flex gap-2" role="tablist" aria-label="Fulfillment">
          {Object.entries(modes).map(([key, item]) => {
            const selected = mode === key
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={selected}
                className={`px-4 py-2 text-sm font-medium transition-colors ${selected ? 'bg-ink text-white' : 'border border-line bg-white text-muted hover:text-ink'}`}
                onClick={() => setMode(key)}
              >
                {item.kicker}
              </button>
            )
          })}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {Object.entries(modes).map(([key, item]) => {
            const selected = mode === key
            return (
              <article
                key={key}
                className={`border p-5 transition-colors sm:p-6 ${selected ? 'border-ink bg-white' : 'hidden border-line bg-canvas lg:block'}`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{item.kicker}</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">{item.title}</h3>
                <ol className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
                  {item.steps.map((step, index) => (
                    <li key={step} className="contents">
                      <span className="border border-line bg-white px-3 py-3 text-sm font-medium">{step}</span>
                      {index < item.steps.length - 1 ? <span className="hidden text-muted sm:block" aria-hidden="true">→</span> : null}
                    </li>
                  ))}
                </ol>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
