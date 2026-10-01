import { useEffect, useMemo, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'
import Map from '../../maps/Map'
import { DELIVERY_ROUTE, deliverySteps, RIDER, YOU } from './homeData'
import { frame, Reveal } from './homeUi'

const shop = DELIVERY_ROUTE[0]
const activeIndex = 3

export default function DeliveryExperience() {
  const reduce = useReducedMotion()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.35 })
  const [step, setStep] = useState(reduce ? activeIndex : 0)
  const markers = useMemo(() => ([
    { coordinates: shop, variant: 'place', label: 'FreshMart', ariaLabel: 'FreshMart', color: '#111827' },
    { coordinates: RIDER, variant: 'rider', label: 'Delivery partner', ariaLabel: 'Delivery partner', pulse: true, zIndex: 2 },
    { coordinates: YOU, variant: 'you', label: 'You', ariaLabel: 'Demo drop-off in Salt Lake', zIndex: 3 },
  ]), [])

  useEffect(() => {
    if (!inView || reduce) return undefined
    const timer = window.setInterval(() => {
      setStep((current) => {
        if (current >= activeIndex) {
          window.clearInterval(timer)
          return activeIndex
        }
        return current + 1
      })
    }, 650)
    return () => window.clearInterval(timer)
  }, [inView, reduce])

  return (
    <section className="bg-canvas" aria-labelledby="delivery-heading">
      <div className={`${frame} grid items-center gap-10 py-16 lg:grid-cols-[0.85fr_1.15fr] lg:py-20`}>
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Delivery</p>
          <h2 id="delivery-heading" className="font-display mt-3 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
            From your neighborhood to your doorstep.
          </h2>
          <p className="mt-4 text-sm text-muted">Order #NE-1042 · FreshMart · ETA 20–30 min</p>
          <ol ref={ref} className="relative mt-8 space-y-0">
            {deliverySteps.map((label, index) => {
              const reached = index <= step
              const current = index === step
              return (
                <li key={label} className="relative flex gap-4 pb-6 last:pb-0">
                  {index < deliverySteps.length - 1 ? (
                    <span className={`absolute left-[7px] top-4 h-full w-px ${index < step ? 'bg-brand' : 'bg-line'}`} aria-hidden="true" />
                  ) : null}
                  <span className={`relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${reached ? 'border-brand bg-brand' : 'border-line bg-white'} ${current ? 'ring-4 ring-brand/20' : ''}`} />
                  <span className={current ? 'font-semibold' : reached ? 'text-ink' : 'text-muted'}>{label}</span>
                </li>
              )
            })}
          </ol>
        </Reveal>
        <div className="min-w-0 overflow-hidden border border-line bg-[#E7E4DE]">
          <Map
            bare
            interactive={false}
            controls={false}
            className="h-[340px] sm:h-[420px]"
            center={RIDER}
            zoom={15}
            markers={markers}
            route={DELIVERY_ROUTE}
            label="Demo route for order NE-1042"
          />
        </div>
      </div>
    </section>
  )
}
