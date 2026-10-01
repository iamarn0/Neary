import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { shopApi } from '../../services'
import { useAuth } from '../../context/AuthContext'
import { usePageMeta } from '../../hooks/usePageMeta'
import PageHero from '../../components/public/PageHero'
import { SkeletonCard } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'

export default function CategoriesPage() {
  usePageMeta('Categories · NEARE', 'Grocery, household, bakery, pharmacy, and more from nearby shops.')
  const { user } = useAuth()
  const categories = useQuery({ queryKey: ['categories'], queryFn: shopApi.categories })

  return (
    <div>
      <PageHero
        eyebrow="Catalogue"
        title="What neighbourhood shops sell on NEARE"
        lede="Categories are public. Opening a shop and adding it to a cart happens after you sign in."
      />
      <section className="mx-auto max-w-6xl px-4 py-16">
        {categories.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        ) : null}
        {categories.isError ? <EmptyState title="Unable to load categories" body={categories.error.message} /> : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(categories.data?.categories || []).map((category) => (
            <Link
              key={category._id}
              to={user?.role === 'CUSTOMER' ? `/explore?category=${category._id}` : '/login'}
              state={{ from: `/explore?category=${category._id}` }}
              className="rounded-2xl border border-line bg-white p-5 hover:border-ink"
            >
              <h2 className="text-lg font-semibold">{category.name}</h2>
              <p className="mt-2 text-sm text-muted">{category.description || 'Available from approved shops near you.'}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
