import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { roleHome } from '../routes/ProtectedRoute'
import { footerGroups, siteNav } from '../pages/public/siteNav'
import PublicNavbar from '../components/public/home/PublicNavbar'
import PublicFooter from '../components/public/home/PublicFooter'

function itemClass(isActive) {
  return isActive ? 'text-ink' : 'text-muted hover:text-ink'
}

export default function PublicLayout() {
  const { user } = useAuth()
  const destination = user ? roleHome(user.role) : '/login'
  const [open, setOpen] = useState(false)
  const path = useLocation().pathname
  const home = path === '/'
  const auth = path === '/login' || path.startsWith('/register')

  useEffect(() => {
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', `${window.location.origin}${path}`)
  }, [path])

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-3 focus:py-2">Skip to content</a>
      {home ? <PublicNavbar /> : (
        <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <Link to="/" className="text-lg font-semibold tracking-tight">NEARE</Link>
          <nav className="hidden items-center gap-5 text-sm md:flex" aria-label="Site">
            {siteNav.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => itemClass(isActive)}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {user ? (
              <Link to={destination} className="rounded-lg bg-ink px-3 py-2 text-sm font-medium text-white">Open dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="hidden text-sm font-medium sm:inline">Sign in</Link>
                <Link to="/register" className="rounded-lg bg-ink px-3 py-2 text-sm font-medium text-white">Get started</Link>
              </>
            )}
            <button type="button" className="md:hidden" aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((value) => !value)}>
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {open ? (
          <nav className="border-t border-line px-4 py-3 md:hidden" aria-label="Site">
            {siteNav.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)} className={({ isActive }) => `block py-2 text-sm ${itemClass(isActive)}`}>
                {item.label}
              </NavLink>
            ))}
            <Link to="/help" onClick={() => setOpen(false)} className="block py-2 text-sm text-muted">Help</Link>
          </nav>
        ) : null}
      </header>
      )}
      <main id="main">
        <Outlet />
      </main>
      {home ? <PublicFooter /> : auth ? null : (
      <footer className="border-t border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <p className="font-semibold">NEARE</p>
            <p className="mt-2 text-sm leading-6 text-muted">Everything you need, near you. Hyperlocal pickup and delivery from neighbourhood shops in Kolkata.</p>
          </div>
          {footerGroups.map((group) => (
            <div key={group.title} className="text-sm">
              <p className="font-medium">{group.title}</p>
              {group.links.map((link) => (
                <Link key={link.to} to={link.to} state={link.state} className="mt-2 block text-muted hover:text-ink">
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="border-t border-line">
          <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted">© {new Date().getFullYear()} NEARE. Neighbourhood commerce for Kolkata.</p>
        </div>
      </footer>
      )}
    </div>
  )
}
