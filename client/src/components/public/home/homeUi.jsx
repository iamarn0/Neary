import { ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { roleHome } from '../../../routes/ProtectedRoute'

export const frame = 'mx-auto w-full max-w-[1180px] px-4 sm:px-6'

export function useHomeLinks() {
  const { user } = useAuth()

  function gate(path) {
    if (user?.role === 'CUSTOMER') return { to: path }
    if (!user) return { to: '/login', state: { from: path } }
    return { to: roleHome(user.role) }
  }

  return {
    user,
    explore: gate('/explore'),
    orders: gate('/orders'),
    search: (q) => gate(`/search?q=${encodeURIComponent(q)}`),
    category: (id) => (id ? gate(`/explore?category=${id}`) : { to: '/categories' }),
    shopDesk: user?.role === 'SHOP_OWNER' ? { to: '/shop' } : { to: '/login', state: { from: '/shop' } },
    deliveryDesk: user?.role === 'DELIVERY_PARTNER' ? { to: '/delivery' } : { to: '/for-delivery' },
    dashboard: user ? roleHome(user.role) : null,
  }
}

const ctaStyles = {
  brand: 'bg-brand text-white hover:bg-[#c44e03]',
  ghost: 'border border-line bg-white text-ink hover:border-ink',
  inverse: 'border border-white/30 text-white hover:bg-white hover:text-ink',
  ink: 'bg-ink text-white hover:bg-ink/90',
}

export function Cta({ to, state, children, variant = 'brand', arrow = false, className = '' }) {
  return (
    <Link
      to={to}
      state={state}
      className={`group inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${ctaStyles[variant]} ${className}`}
    >
      {children}
      {arrow ? <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" /> : null}
    </Link>
  )
}

export function Reveal({ children, className = '', delay = 0 }) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  )
}
