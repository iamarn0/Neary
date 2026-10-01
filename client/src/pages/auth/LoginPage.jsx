import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { usePageMeta } from '../../hooks/usePageMeta'
import { afterLogin } from '../../routes/ProtectedRoute'
import AuthFrame, { AuthField, AuthInput, AuthLinks, AuthNote, AuthPassword, AuthTextLink } from '../../components/auth/AuthFrame'
import Button from '../../components/ui/Button'

const demos = [
  { label: 'Customer', email: 'customer@neare.local', password: 'Customer@123' },
  { label: 'Shop', email: 'shop@neare.local', password: 'Shop@123' },
  { label: 'Delivery', email: 'delivery@neare.local', password: 'Delivery@123' },
  { label: 'Admin', email: 'admin@neare.local', password: 'Admin@123' },
]

export default function LoginPage() {
  usePageMeta('Sign in · NEARE')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const user = await login({ email, password })
      navigate(afterLogin(user.role, location.state?.from))
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <AuthFrame
      kicker="Sign in"
      title="Your neighbourhood desk."
      lede="Customers open the marketplace. Shop owners, delivery partners, and admins open their own desks."
      notes={[
        <AuthNote key="customer" label="Customer" value="Marketplace" />,
        <AuthNote key="shop" label="Shop" value="Orders and stock" />,
        <AuthNote key="delivery" label="Delivery" value="Trips nearby" />,
        <AuthNote key="admin" label="Admin" value="The city desk" />,
      ]}
    >
      <form onSubmit={onSubmit} className="mx-auto w-full max-w-md">
        <h2 className="font-display text-3xl tracking-tight">Sign in</h2>
        <div className="mt-8 space-y-5">
          <AuthField label="Email">
            <AuthInput name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </AuthField>
          <AuthField label="Password">
            <AuthPassword name="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </AuthField>
        </div>
        {error ? <p className="mt-4 text-sm text-danger" role="alert">{error}</p> : null}
        <Button className="mt-6 w-full" variant="brand" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
        <AuthLinks>New here? <AuthTextLink to="/register">Create an account</AuthTextLink></AuthLinks>
        <div className="mt-10 border-t border-line pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Demo desks</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {demos.map((demo) => (
              <button
                key={demo.email}
                type="button"
                onClick={() => { setEmail(demo.email); setPassword(demo.password); setError('') }}
                className="border border-line bg-white px-3 py-2.5 text-left hover:border-ink"
              >
                <span className="block text-sm font-medium">{demo.label}</span>
                <span className="mt-0.5 block truncate text-xs text-muted">{demo.email}</span>
              </button>
            ))}
          </div>
        </div>
      </form>
    </AuthFrame>
  )
}
