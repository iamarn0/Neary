import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { usePageMeta } from '../../hooks/usePageMeta'
import { roleHome } from '../../routes/ProtectedRoute'
import { shopOwnerApi } from '../../services'
import AuthFrame, { AuthField, AuthInput, AuthLinks, AuthNote, AuthPassword, AuthTextLink } from '../../components/auth/AuthFrame'
import PartnerApplication from '../../components/delivery/PartnerApplication'
import ShopApplication from '../../components/shop/ShopApplication'
import Button from '../../components/ui/Button'

const ROLES = ['CUSTOMER', 'SHOP_OWNER', 'DELIVERY_PARTNER']

export default function RegisterPage() {
  const [params] = useSearchParams()
  const requested = params.get('role')
  if (!ROLES.includes(requested)) return <RoleChooser />
  if (requested === 'SHOP_OWNER') return <ShopOwnerRegister />
  if (requested === 'DELIVERY_PARTNER') return <PartnerRegister />
  return <AccountRegister />
}

function RoleChooser() {
  usePageMeta('Create account · NEARE')
  const choices = [
    {
      to: '/register?role=CUSTOMER',
      index: '01',
      title: 'Customer',
      body: 'Find nearby shops and order for pickup or delivery.',
    },
    {
      to: '/register?role=SHOP_OWNER',
      index: '02',
      title: 'Shop owner',
      body: 'Register the shop, set hours, and take local orders.',
    },
    {
      to: '/register?role=DELIVERY_PARTNER',
      index: '03',
      title: 'Delivery partner',
      body: 'Carry orders from shops in your area.',
    },
  ]

  return (
    <AuthFrame
      kicker="Create account"
      title="Pick the desk you are opening."
      lede="Customer, shop, and delivery registration stay separate. The form that follows matches the role."
      notes={[
        <AuthNote key="one" label="One account" value="One role" />,
        <AuthNote key="shop" label="Shops" value="Reviewed before they go live" />,
        <AuthNote key="pay" label="Partners" value="Payout account on file" />,
      ]}
    >
      <div className="mx-auto w-full max-w-lg">
        <h2 className="font-display text-3xl tracking-tight">How will you use NEARE?</h2>
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {choices.map((choice) => (
            <li key={choice.to}>
              <Link to={choice.to} className="group flex items-center justify-between gap-4 py-5">
                <span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{choice.index}</span>
                  <span className="mt-1 block font-display text-2xl tracking-tight">{choice.title}</span>
                  <span className="mt-1 block text-sm text-muted">{choice.body}</span>
                </span>
                <ArrowRight size={18} className="shrink-0 transition group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
        <AuthLinks>Already have an account? <AuthTextLink to="/login">Sign in</AuthTextLink></AuthLinks>
      </div>
    </AuthFrame>
  )
}

function PartnerRegister() {
  usePageMeta('Become a delivery partner · NEARE')
  const { register } = useAuth()
  const navigate = useNavigate()

  return (
    <AuthFrame
      kicker="Delivery partner"
      title="From the shop to the door."
      lede="Create the partner account, add Aadhaar, PAN, and the bank account used for payouts, then mark the neighbourhood you cover."
      notes={[
        <AuthNote key="id" label="Identity" value="Aadhaar and PAN" />,
        <AuthNote key="bank" label="Payouts" value="Bank account" />,
        <AuthNote key="area" label="Coverage" value="Your start pin" />,
      ]}
    >
      <PartnerApplication
        onSubmit={async (payload) => {
          const user = await register(payload)
          navigate(roleHome(user.role))
        }}
      />
      <AuthLinks>
        Already have an account? <AuthTextLink to="/login">Sign in</AuthTextLink>
        {' · '}
        <AuthTextLink to="/register">Choose a different role</AuthTextLink>
      </AuthLinks>
    </AuthFrame>
  )
}

function ShopOwnerRegister() {
  usePageMeta('Register your shop · NEARE')
  const { register } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const created = useRef(false)

  return (
    <AuthFrame
      kicker="Shop partner"
      title="Put the shop on the map."
      lede="Create the owner account and the shop application together: what you sell, where you are, and whether customers pick up or get delivery."
      notes={[
        <AuthNote key="review" label="Go live" value="After admin review" />,
        <AuthNote key="orders" label="Desk" value="Orders, stock, hours" />,
        <AuthNote key="ways" label="Fulfilment" value="Pickup or delivery" />,
      ]}
    >
      <ShopApplication
        includeOwner
        onSubmit={async ({ owner, shop }) => {
          if (!created.current) {
            await register({ ...owner, role: 'SHOP_OWNER' })
            created.current = true
          }
          await shopOwnerApi.register(shop)
          toast.success('Submitted for approval')
          navigate('/shop')
        }}
      />
      <AuthLinks>
        Already have an account? <AuthTextLink to="/login">Sign in</AuthTextLink>
        {' · '}
        <AuthTextLink to="/register">Choose a different role</AuthTextLink>
      </AuthLinks>
    </AuthFrame>
  )
}

function AccountRegister() {
  usePageMeta('Create account · NEARE')
  const { register } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.target)
    setBusy(true)
    setError('')
    try {
      const user = await register({
        name: form.get('name'),
        email: form.get('email'),
        phone: form.get('phone'),
        password: form.get('password'),
        role: 'CUSTOMER',
      })
      navigate(roleHome(user.role))
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <AuthFrame
      kicker="Customer"
      title="Everything you need, near you."
      lede="Create an account, then discover shops around you and choose pickup or delivery."
      notes={[
        <AuthNote key="shops" label="Shops" value="Near your pin" />,
        <AuthNote key="order" label="Orders" value="Pickup or delivery" />,
        <AuthNote key="track" label="Tracking" value="From shop to door" />,
      ]}
    >
      <form onSubmit={onSubmit} className="mx-auto w-full max-w-md">
        <h2 className="font-display text-3xl tracking-tight">Create your account</h2>
        <div className="mt-8 space-y-5">
          <AuthField label="Name"><AuthInput name="name" autoComplete="name" required /></AuthField>
          <AuthField label="Email"><AuthInput name="email" type="email" autoComplete="email" required /></AuthField>
          <AuthField label="Mobile"><AuthInput name="phone" inputMode="numeric" autoComplete="tel" required /></AuthField>
          <AuthField label="Password"><AuthPassword name="password" autoComplete="new-password" minLength={8} required /></AuthField>
        </div>
        {error ? <p className="mt-4 text-sm text-danger" role="alert">{error}</p> : null}
        <Button className="mt-6 w-full" variant="brand" type="submit" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</Button>
        <AuthLinks>
          Already have an account? <AuthTextLink to="/login">Sign in</AuthTextLink>
          {' · '}
          <AuthTextLink to="/register">Choose a different role</AuthTextLink>
        </AuthLinks>
      </form>
    </AuthFrame>
  )
}
