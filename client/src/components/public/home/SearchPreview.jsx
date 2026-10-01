import { useState } from 'react'
import { Search } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { suggestions } from './homeData'
import { useHomeLinks } from './homeUi'

export default function SearchPreview() {
  const navigate = useNavigate()
  const links = useHomeLinks()
  const [query, setQuery] = useState('')

  function go(value) {
    const next = value.trim()
    if (!next) return
    const destination = links.search(next)
    navigate(destination.to, { state: destination.state })
  }

  return (
    <form
      className="border border-line bg-white p-4 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault()
        go(query)
      }}
    >
      <label htmlFor="neighbourhood-search" className="font-display text-[1.7rem] leading-none tracking-tight sm:text-3xl">
        What are you looking for?
      </label>
      <div className="mt-4 flex items-center gap-2 border border-line bg-canvas px-3 transition-colors focus-within:border-ink">
        <Search size={16} className="shrink-0 text-muted" aria-hidden="true" />
        <input
          id="neighbourhood-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search products, shops, or categories"
          className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted"
        />
        <button type="submit" className="shrink-0 bg-ink px-3 py-2 text-sm font-medium text-white">
          Search
        </button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Popular</span>
        {suggestions.map((item) => {
          const destination = links.search(item.q)
          return (
            <Link
              key={item.label}
              to={destination.to}
              state={destination.state}
              className="border border-line px-3 py-1.5 text-sm transition-colors hover:border-ink hover:bg-ink hover:text-white"
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </form>
  )
}
