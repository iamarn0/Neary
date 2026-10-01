import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SkeletonList } from '../components/ui/Skeleton'

export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="p-8"><SkeletonList /></div>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return <Outlet />
}

export function roleHome(role) {
  if (role === 'SHOP_OWNER') return '/shop'
  if (role === 'DELIVERY_PARTNER') return '/delivery'
  if (role === 'ADMIN') return '/admin'
  return '/home'
}

export function afterLogin(role, from) {
  const home = roleHome(role)
  if (!from || from === '/' || from === '/login' || from === '/register') return home
  if (role === 'CUSTOMER' && !from.startsWith('/shop') && !from.startsWith('/delivery') && !from.startsWith('/admin')) return from
  if (role === 'SHOP_OWNER' && from.startsWith('/shop')) return from
  if (role === 'DELIVERY_PARTNER' && from.startsWith('/delivery')) return from
  if (role === 'ADMIN' && from.startsWith('/admin')) return from
  return home
}
