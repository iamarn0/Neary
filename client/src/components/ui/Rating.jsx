import { Star } from 'lucide-react'

export default function Rating({ value = 0, count }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <Star size={14} className="fill-ink text-ink" aria-hidden="true" />
      <span className="font-medium">{Number(value || 0).toFixed(1)}</span>
      {count != null ? <span className="text-muted">({count})</span> : null}
    </span>
  )
}
