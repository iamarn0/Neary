import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Link, NavLink } from 'react-router-dom'
import { navItems } from './homeData'
import { Cta, frame, useHomeLinks } from './homeUi'

function navClass(isActive) {
  return `relative text-sm transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-full after:origin-left after:bg-brand after:transition-transform after:duration-200 hover:text-ink ${
    isActive ? 'text-ink after:scale-x-100' : 'text-muted after:scale-x-0 hover:after:scale-x-100'
  }`
}

export default function PublicNavbar() {
  const { user, explore, dashboard } = useHomeLinks()
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const bar = scrolled
    ? 'border-line bg-[#FAFAF8]/88 shadow-[0_1px_0_rgba(17,24,39,0.04)]'
    : 'border-transparent bg-[#FAFAF8]/55'

  return (
    <>
    <header className={`sticky top-0 z-50 border-b backdrop-blur-md transition-[background-color,border-color,box-shadow] duration-200 ${bar}`}>
      <div className={`${frame} flex h-14 items-center gap-6`}>
        <Link to="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight" aria-label="NEARE home">
          <span className="h-2.5 w-2.5 bg-brand" aria-hidden="true" />
          NEARE
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Site">
          <NavLink to="/how-it-works" className={({ isActive }) => navClass(isActive)}>How it works</NavLink>
          <Link to={explore.to} state={explore.state} className={navClass(false)}>Explore</Link>
          {navItems.slice(1).map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => navClass(isActive)}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-4 md:flex">
          {user ? (
            <Cta to={dashboard} variant="ink">Open dashboard</Cta>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-ink underline-offset-4 hover:underline">Sign in</Link>
              <Cta to="/register" variant="brand">Get started</Cta>
            </>
          )}
        </div>
        <button
          type="button"
          className="ml-auto grid h-10 w-10 place-items-center md:hidden"
          aria-expanded={open}
          aria-controls="home-menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
        </button>
      </div>
    </header>
      <AnimatePresence>
        {open ? (
          <motion.div
            id="home-menu"
            className="fixed inset-x-0 bottom-0 top-14 z-40 border-t border-line bg-white md:hidden"
            initial={reduce ? false : { x: '100%' }}
            animate={{ x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: '100%' }}
            transition={{ duration: reduce ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <nav className="flex h-full flex-col px-5 py-6" aria-label="Site">
              <NavLink to="/how-it-works" onClick={() => setOpen(false)} className="border-b border-line py-3.5 text-lg">How it works</NavLink>
              <Link to={explore.to} state={explore.state} onClick={() => setOpen(false)} className="border-b border-line py-3.5 text-lg">Explore</Link>
              {navItems.slice(1).map((item) => (
                <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)} className="border-b border-line py-3.5 text-lg">
                  {item.label}
                </NavLink>
              ))}
              <div className="mt-auto grid gap-3 pb-4">
                {user ? (
                  <Cta to={dashboard} variant="ink" className="w-full" >Open dashboard</Cta>
                ) : (
                  <>
                    <Cta to="/login" variant="ghost" className="w-full">Sign in</Cta>
                    <Cta to="/register" variant="brand" className="w-full">Get started</Cta>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
