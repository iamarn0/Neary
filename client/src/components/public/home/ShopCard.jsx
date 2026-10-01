import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import Media from '../../Media'
import { formatKm } from './homeData'
import { useHomeLinks } from './homeUi'

function initials(name) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('')
}

export default function ShopCard({ shop }) {
  const { explore } = useHomeLinks()
  const modes = [shop.delivery ? 'Delivery' : null, shop.pickup ? 'Pickup' : null].filter(Boolean).join(' · ')

  return (
    <Link
      to={explore.to}
      state={explore.state}
      className="group flex w-[82vw] shrink-0 snap-start flex-col border border-line bg-white transition-transform duration-200 hover:-translate-y-0.5 hover:border-ink sm:w-[46vw] md:w-auto"
    >
      <div className="relative h-40 overflow-hidden">
        <Media
          src={shop.cover}
          alt={`${shop.name} in ${shop.area}`}
          loading="lazy"
          className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <span className="absolute bottom-3 left-3 grid h-10 w-10 place-items-center border border-line bg-white text-[11px] font-semibold tracking-wide">
          {initials(shop.name)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">{shop.name}</h3>
            <p className="mt-0.5 text-sm text-muted">{shop.category}</p>
          </div>
          {shop.rating ? (
            <p className="text-sm font-medium">★ {shop.rating.toFixed(1)}</p>
          ) : (
            <p className="text-sm text-muted">New</p>
          )}
        </div>
        <p className="mt-3 flex items-center gap-2 text-sm">
          <span className={`h-1.5 w-1.5 rounded-full ${shop.open ? 'bg-success' : 'bg-line'}`} aria-hidden="true" />
          <span>{shop.open ? 'Open' : 'Closed'}</span>
          <span className="text-muted">· {formatKm(shop.km)}</span>
        </p>
        <p className="mt-1 text-sm text-muted">{shop.prep[0]}–{shop.prep[1]} min</p>
        <p className="mt-4 flex items-center justify-between text-sm">
          <span>{modes}</span>
          <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </p>
      </div>
    </Link>
  )
}
