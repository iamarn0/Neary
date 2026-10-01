import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { shopApi } from '../../../services'
import { categories } from './homeData'
import { frame, Reveal } from './homeUi'
import CategoryCard from './CategoryCard'

export default function CategoryGrid() {
  const query = useQuery({ queryKey: ['categories'], queryFn: shopApi.categories })
  const byName = Object.fromEntries((query.data?.categories || []).map((item) => [item.name, item._id]))

  return (
    <section className="bg-canvas" aria-labelledby="nearby-categories">
      <div className={`${frame} py-16 lg:py-20`}>
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Categories</p>
            <h2 id="nearby-categories" className="font-display mt-3 max-w-xl text-4xl leading-[1.05] tracking-tight sm:text-5xl">
              Whatever you need, it's probably nearby.
            </h2>
          </div>
          <Link to="/categories" className="text-sm font-medium text-info transition-colors hover:text-ink">
            Full catalogue
          </Link>
        </Reveal>
        <div className="mt-8 grid grid-cols-2 gap-3 lg:auto-rows-[188px] lg:grid-cols-4 lg:gap-4">
          {categories.map((category) => (
            <CategoryCard key={category.name} category={category} categoryId={byName[category.name]} />
          ))}
        </div>
      </div>
    </section>
  )
}
