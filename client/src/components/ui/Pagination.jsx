export default function Pagination({ page = 1, pages = 1, onPage }) {
  if (pages <= 1) return null
  return (
    <nav className="mt-4 flex items-center gap-2 text-sm" aria-label="Pagination">
      <button type="button" className="rounded-lg border border-line bg-white px-3 py-1.5 disabled:opacity-40" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </button>
      <span>Page {page} of {pages}</span>
      <button type="button" className="rounded-lg border border-line bg-white px-3 py-1.5 disabled:opacity-40" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next
      </button>
    </nav>
  )
}
