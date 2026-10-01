import { Link } from 'react-router-dom'

export default function CategoryCard({ category }) {
  return (
    <Link
      to={`/explore?category=${category._id}`}
      className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium hover:border-ink"
    >
      {category.name}
    </Link>
  )
}
