import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function DashboardLayout({ title, items }) {
  const { user, logout } = useAuth()
  useEffect(() => {
    let robots = document.querySelector('meta[name="robots"]')
    if (!robots) {
      robots = document.createElement('meta')
      robots.setAttribute('name', 'robots')
      document.head.appendChild(robots)
    }
    robots.setAttribute('content', 'noindex, nofollow')
  }, [])
  return (
    <div className="min-h-screen md:grid md:grid-cols-[220px_1fr]">
      <aside className="border-b border-line bg-white md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <p className="text-sm font-semibold">NEARE</p>
            <p className="text-xs text-muted">{title}</p>
          </div>
          <button type="button" onClick={logout} className="text-xs text-muted">Sign out</button>
        </div>
        <nav className="flex gap-1 overflow-auto px-3 pb-3 md:flex-col" aria-label={title}>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `whitespace-nowrap rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-ink text-white' : 'text-muted hover:bg-canvas'}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <p className="hidden px-4 pb-4 text-xs text-muted md:block">{user?.name}</p>
      </aside>
      <main className="px-4 py-6 md:px-8">
        <Outlet />
      </main>
    </div>
  )
}
