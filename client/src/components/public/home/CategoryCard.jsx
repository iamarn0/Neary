import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import Media from '../../Media'
import { useHomeLinks } from './homeUi'

export default function CategoryCard({ category, categoryId }) {
  const links = useHomeLinks()
  const destination = links.category(categoryId)
  const countLabel = category.count > 0
    ? `${category.count} ${category.count === 1 ? 'shop' : 'shops'} in the demo`
    : 'In the demo catalogue'

  return (
    <Link
      to={destination.to}
      state={destination.state}
      className={`group flex h-full flex-col border border-line bg-white ${category.span || ''}`}
    >
      {category.panel ? (
        <div className="flex h-32 items-end bg-ink p-4 sm:h-36 lg:h-auto lg:min-h-36 lg:flex-1">
          <p className="font-display text-2xl italic leading-none text-white">From the counter.</p>
        </div>
      ) : (
        <div className="relative h-32 overflow-hidden sm:h-36 lg:h-auto lg:min-h-36 lg:flex-1">
          <Media
            src={category.image}
            alt=""
            loading="lazy"
            className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold">{category.name}</h3>
        <p className="mt-1 text-sm text-muted">{category.descriptor}</p>
        <p className="mt-4 flex items-center justify-between gap-3 text-sm">
          <span className="text-muted">{countLabel}</span>
          <ArrowRight size={16} className="shrink-0 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </p>
      </div>
    </Link>
  )
}
