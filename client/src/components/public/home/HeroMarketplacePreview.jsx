import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import Map from '../../maps/Map'
import { catalogue, formatKm, HERO_CENTER, heroMarkers } from './homeData'

const basketKm = formatKm(catalogue.find((shop) => shop.name === 'Daily Basket').km)

export default function HeroMarketplacePreview() {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(reduce ? heroMarkers : [])

  useEffect(() => {
    if (reduce) {
      setShown(heroMarkers)
      return undefined
    }
    setShown([])
    const timers = heroMarkers.map((marker, index) => window.setTimeout(() => {
      setShown((current) => (current.some((item) => item.key === marker.key) ? current : [...current, marker]))
    }, 280 + index * 180))
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [reduce])

  const float = (delay) => (reduce
    ? {}
    : {
        animate: { y: [0, -7, 0] },
        transition: { duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay },
      })

  return (
    <div className="relative mx-auto h-[440px] w-full min-w-0 max-w-[560px] sm:h-[520px]">
      <div className="absolute inset-x-3 bottom-8 top-12 overflow-hidden border border-line bg-[#E7E4DE] sm:inset-x-6">
        <Map
          bare
          interactive={false}
          controls={false}
          className="h-full w-full"
          center={HERO_CENTER}
          zoom={14.5}
          markers={shown}
          label="Demo neighborhood map around Salt Lake"
        />
        <p className="pointer-events-none absolute left-2 top-2 bg-white/90 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
          Demo · Salt Lake
        </p>
      </div>

      <button
        type="button"
        onClick={() => document.getElementById('neighbourhood-search')?.focus()}
        className="absolute left-0 right-8 top-0 z-10 flex items-center gap-2 border border-ink bg-white px-3.5 py-3 text-left text-sm text-muted transition-colors hover:bg-canvas sm:right-12"
      >
        <Search size={16} aria-hidden="true" />
        Search nearby...
      </button>

      <motion.div className="absolute left-0 top-[38%] z-10 w-[9.6rem] sm:top-32 sm:w-52" {...float(0.2)}>
        <motion.article
          className="border border-line bg-white p-3"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Grocery</p>
          <h3 className="mt-1 font-semibold">FreshMart</h3>
          <p className="mt-1 text-sm text-muted">0.8 km · 20–30 min</p>
        </motion.article>
      </motion.div>

      <motion.div className="absolute right-0 top-16 z-10 w-[9.2rem] sm:top-[42%] sm:w-48" {...float(0.8)}>
        <motion.article
          className="border border-line bg-white p-3"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Lake Town</p>
          <h3 className="mt-1 font-semibold">Daily Basket</h3>
          <p className="mt-1 text-sm text-muted">{basketKm} · Pickup</p>
        </motion.article>
      </motion.div>

      <motion.div className="absolute bottom-0 left-0 z-10 w-[12.25rem] sm:w-56" {...float(1.2)}>
        <motion.article
          className="border border-ink bg-ink p-3 text-white"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.4 }}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">Order #NE-1042</p>
            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
          </div>
          <p className="mt-2 text-sm font-medium">Out for delivery</p>
          <p className="mt-1 text-sm text-white/70">20–30 min · from FreshMart</p>
        </motion.article>
      </motion.div>
    </div>
  )
}
