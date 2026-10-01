import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { stats } from './homeData'
import { frame, Reveal } from './homeUi'

function CountUp({ value }) {
  const reduce = useReducedMotion()
  const ref = useRef(null)
  const [current, setCurrent] = useState(reduce ? value : 0)

  useEffect(() => {
    if (reduce) return undefined
    const node = ref.current
    if (!node) return undefined
    let frameId = 0
    let started = false
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started) return
      started = true
      const start = performance.now()
      const duration = 700
      const tick = (now) => {
        const progress = Math.min(1, (now - start) / duration)
        const eased = 1 - (1 - progress) ** 3
        setCurrent(Math.round(value * eased))
        if (progress < 1) frameId = requestAnimationFrame(tick)
      }
      frameId = requestAnimationFrame(tick)
    }, { threshold: 0.5 })
    observer.observe(node)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frameId)
    }
  }, [reduce, value])

  return <span ref={ref}>{current}</span>
}

export default function StatsStrip() {
  return (
    <section className="bg-white" aria-label="Demo catalogue">
      <div className={`${frame} py-10 lg:py-12`}>
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Kolkata demo catalogue</p>
          <dl className="mt-4 grid grid-cols-2 border border-line lg:grid-cols-4">
            {stats.map((item) => (
              <div key={item.label} className="border-b border-r border-line p-5 [&:nth-child(2n)]:border-r-0 max-lg:[&:nth-last-child(-n+2)]:border-b-0 lg:border-b-0 lg:[&:nth-child(2)]:border-r lg:[&:nth-child(4)]:border-r-0">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{item.label}</dt>
                <dd className={`font-display mt-2 tracking-tight text-ink ${item.text ? 'text-[1.85rem] leading-none' : 'text-4xl'}`}>
                  {item.value != null ? <CountUp value={item.value} /> : item.text}
                </dd>
                <p className="mt-1 text-xs text-muted">{item.hint}</p>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  )
}
