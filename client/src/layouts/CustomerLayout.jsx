import { useEffect, useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import { Home, Compass, ShoppingBag, UserRound, ShoppingCart, MapPin, Bell } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useLocationSelection } from '../context/LocationContext'
import { notificationApi } from '../services'
import { getSocket } from '../lib/socket'
import { useCart } from '../features/cart/useCart'
import CartDrawer from '../components/CartDrawer'
import LocationSelector from '../components/LocationSelector'
import Modal from '../components/ui/Modal'

const links = [
  { to: '/home', label: 'Home', icon: Home, end: true },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

export default function CustomerLayout() {
  const reduce = useReducedMotion()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { location } = useLocationSelection()
  const { query } = useCart()
  const [cartOpen, setCartOpen] = useState(false)
  const [locationOpen, setLocationOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const notes = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationApi.list,
    enabled: Boolean(user),
  })
  const count = query.data?.cart?.itemCount || 0

  useEffect(() => {
    let robots = document.querySelector('meta[name="robots"]')
    if (!robots) {
      robots = document.createElement('meta')
      robots.setAttribute('name', 'robots')
      document.head.appendChild(robots)
    }
    const previous = robots.getAttribute('content')
    robots.setAttribute('content', 'noindex, nofollow')
    return () => {
      if (previous) robots.setAttribute('content', previous)
    }
  }, [])

  useEffect(() => {
    if (!user) return undefined
    const socket = getSocket()
    const refresh = () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
    socket?.on('notification:new', refresh)
    return () => socket?.off('notification:new', refresh)
  }, [user, queryClient])

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-3 focus:py-2">Skip to content</a>
      <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link to="/home" className="text-lg font-semibold tracking-tight">NEARE</Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-canvas font-medium text-ink' : 'text-muted'}`}>
                {link.label}
              </NavLink>
            ))}
            <NavLink to="/favorites" className={({ isActive }) => `rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-canvas font-medium' : 'text-muted'}`}>Favorites</NavLink>
          </nav>
          <button type="button" onClick={() => setLocationOpen(true)} className="ml-auto hidden max-w-[220px] items-center gap-2 truncate text-sm text-muted sm:flex">
            <MapPin size={16} aria-hidden="true" />
            <span className="truncate">{location?.label || 'Set location'}</span>
          </button>
          {user ? (
            <div className="relative">
              <button type="button" className="relative text-muted" aria-label="Notifications" aria-expanded={notesOpen} onClick={() => setNotesOpen((open) => !open)}>
                <Bell size={18} />
                {notes.data?.unread ? <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-brand" /> : null}
              </button>
              {notesOpen ? (
                <div className="absolute right-0 z-30 mt-2 w-80 border border-line bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between text-sm">
                    <p className="font-medium">Notifications</p>
                    <button type="button" className="text-info" onClick={() => notificationApi.readAll().then(() => queryClient.invalidateQueries({ queryKey: ['notifications'] }))}>Mark all as read</button>
                  </div>
                  <ul className="mt-2 max-h-80 space-y-2 overflow-auto">
                    {(notes.data?.notifications || []).slice(0, 8).map((note) => (
                      <li key={note._id} className="border-t border-line pt-2 text-sm">
                        <p className="font-medium">{note.title}</p>
                        <p className="text-muted">{note.message}</p>
                      </li>
                    ))}
                    {!notes.data?.notifications?.length ? <li className="text-sm text-muted">No notifications yet.</li> : null}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <Link to="/login" className="text-sm font-medium">Sign in</Link>
          )}
          <button type="button" onClick={() => setCartOpen(true)} className="relative" aria-label={`Cart, ${count} items`}>
            <ShoppingCart size={18} />
            {count ? <span className="absolute -right-2 -top-2 rounded-full bg-ink px-1.5 text-[10px] text-white">{count}</span> : null}
          </button>
        </div>
      </header>
      <motion.main
        id="main"
        className="mx-auto max-w-6xl px-4 py-6 pb-24 md:pb-10"
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Outlet />
      </motion.main>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-line bg-white md:hidden" aria-label="Mobile">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `flex flex-col items-center gap-1 py-2 text-xs ${isActive ? 'text-ink' : 'text-muted'}`}>
            <link.icon size={18} aria-hidden="true" />
            {link.label}
          </NavLink>
        ))}
      </nav>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <Modal open={locationOpen} title="Location" onClose={() => setLocationOpen(false)} className="max-w-md max-h-[85vh] overflow-auto">
        <LocationSelector onDone={() => setLocationOpen(false)} />
      </Modal>
    </div>
  )
}
