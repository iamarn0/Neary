import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { shopApi } from '../../services'
import { useGeolocation } from '../../hooks/useGeolocation'
import LocationPicker from '../maps/LocationPicker'
import Button from '../ui/Button'
import { Field, SelectInput, TextArea, TextInput } from '../ui/Field'

const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
const PHONE = /^[6-9]\d{9}$/
const PIN = /^[1-9]\d{5}$/

const emptyShop = {
  name: '',
  description: '',
  category: '',
  phone: '',
  email: '',
  gstin: '',
  address: '',
  city: 'Kolkata',
  state: 'West Bengal',
  pinCode: '',
  openingTime: '08:00',
  closingTime: '21:00',
  pickupAvailable: true,
  deliveryAvailable: true,
  deliveryRadius: '5',
  prepTimeMin: '15',
  prepTimeMax: '30',
}

function minutesLabel(min, max) {
  return `${min}–${max} min`
}

export default function ShopApplication({ includeOwner = false, onSubmit }) {
  const labels = includeOwner ? ['Owner', 'Shop', 'Address', 'Service', 'Review'] : ['Shop', 'Address', 'Service', 'Review']
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [owner, setOwner] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [shop, setShop] = useState(emptyShop)
  const [logo, setLogo] = useState(null)
  const [logoUrl, setLogoUrl] = useState('')
  const logoUrlRef = useRef('')
  const [coords, setCoords] = useState(null)
  const geo = useGeolocation()
  const categories = useQuery({ queryKey: ['categories'], queryFn: shopApi.categories })
  const catalogue = categories.data?.categories || []
  const current = labels[step]
  const categoryName = catalogue.find((item) => item._id === shop.category)?.name || '—'

  useEffect(() => {
    if (geo.coordinates) setCoords(geo.coordinates)
  }, [geo.coordinates])

  useEffect(() => () => {
    if (logoUrlRef.current) URL.revokeObjectURL(logoUrlRef.current)
  }, [])

  function setOwnerField(key) {
    return (event) => setOwner((currentOwner) => ({ ...currentOwner, [key]: event.target.value }))
  }

  function setShopField(key) {
    return (event) => {
      const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
      setShop((currentShop) => ({ ...currentShop, [key]: value }))
    }
  }

  function validate(label) {
    if (label === 'Owner') {
      if (owner.name.trim().length < 2) return 'Enter the owner’s name.'
      if (!/\S+@\S+\.\S+/.test(owner.email.trim())) return 'Enter a valid email.'
      if (!PHONE.test(owner.phone.trim())) return 'Enter a 10-digit Indian mobile number.'
      if (owner.password.length < 8) return 'Use at least 8 characters for the password.'
      if (owner.password !== owner.confirm) return 'Passwords do not match.'
    }
    if (label === 'Shop') {
      if (shop.name.trim().length < 2) return 'Enter the shop name.'
      if (!shop.category) return 'Choose a category.'
      if (shop.description.trim().length < 20) return 'Describe the shop in at least a sentence.'
      if (!PHONE.test(shop.phone.trim())) return 'Enter the shop’s 10-digit mobile number.'
      if (shop.email.trim() && !/\S+@\S+\.\S+/.test(shop.email.trim())) return 'Enter a valid shop email, or leave it blank.'
      if (shop.gstin.trim() && !GSTIN.test(shop.gstin.trim().toUpperCase())) return 'Enter a valid GSTIN, or leave it blank.'
      if (logo && logo.size > 2 * 1024 * 1024) return 'The logo must be under 2 MB.'
    }
    if (label === 'Address') {
      if (shop.address.trim().length < 6) return 'Enter the street address.'
      if (!shop.city.trim() || !shop.state.trim()) return 'Enter the city and state.'
      if (!PIN.test(shop.pinCode.trim())) return 'Enter a 6-digit PIN code.'
      if (!coords || coords.length !== 2 || coords.some((value) => !Number.isFinite(Number(value)))) {
        return 'Drop a pin on the shop.'
      }
    }
    if (label === 'Service') {
      if (!shop.openingTime || !shop.closingTime) return 'Set opening and closing times.'
      if (!shop.pickupAvailable && !shop.deliveryAvailable) return 'Offer pickup, delivery, or both.'
      const radius = Number(shop.deliveryRadius)
      if (shop.deliveryAvailable && (!Number.isFinite(radius) || radius < 1 || radius > 25)) {
        return 'Delivery radius must be between 1 and 25 km.'
      }
      const earliest = Number(shop.prepTimeMin)
      const latest = Number(shop.prepTimeMax)
      if (!Number.isFinite(earliest) || earliest < 5 || earliest > 180) return 'Earliest prep time must be between 5 and 180 minutes.'
      if (!Number.isFinite(latest) || latest < earliest || latest > 240) return 'Latest prep time must be after the earliest, up to 240 minutes.'
    }
    return ''
  }

  function continueTo(event) {
    event.preventDefault()
    const message = validate(current)
    if (message) {
      setError(message)
      return
    }
    setError('')
    if (current === 'Owner') {
      setShop((currentShop) => ({
        ...currentShop,
        phone: currentShop.phone || owner.phone.trim(),
        email: currentShop.email || owner.email.trim(),
      }))
    }
    setStep((index) => index + 1)
  }

  async function finish(event) {
    event.preventDefault()
    for (const label of labels) {
      const message = validate(label)
      if (message) {
        setError(message)
        setStep(labels.indexOf(label))
        return
      }
    }
    setBusy(true)
    setError('')
    try {
      await onSubmit({
        owner: includeOwner
          ? { name: owner.name.trim(), email: owner.email.trim(), phone: owner.phone.trim(), password: owner.password }
          : undefined,
        shop: {
          name: shop.name.trim(),
          description: shop.description.trim(),
          category: shop.category,
          phone: shop.phone.trim(),
          email: shop.email.trim(),
          gstin: shop.gstin.trim().toUpperCase(),
          address: shop.address.trim(),
          city: shop.city.trim(),
          state: shop.state.trim(),
          pinCode: shop.pinCode.trim(),
          openingTime: shop.openingTime,
          closingTime: shop.closingTime,
          pickupAvailable: shop.pickupAvailable,
          deliveryAvailable: shop.deliveryAvailable,
          deliveryRadius: Number(shop.deliveryRadius),
          prepTimeMin: Number(shop.prepTimeMin),
          prepTimeMax: Number(shop.prepTimeMax),
          longitude: Number(coords[0]),
          latitude: Number(coords[1]),
          logo,
        },
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function onLogo(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (logoUrlRef.current) URL.revokeObjectURL(logoUrlRef.current)
    const url = URL.createObjectURL(file)
    logoUrlRef.current = url
    setLogo(file)
    setLogoUrl(url)
  }

  return (
    <form onSubmit={current === 'Review' ? finish : continueTo} className="border border-line bg-white p-5 sm:p-8">
      <ol className="flex flex-wrap gap-2" aria-label="Application steps">
        {labels.map((label, index) => {
          const active = index === step
          const done = index < step
          return (
            <li key={label}>
              <button
                type="button"
                disabled={index > step}
                aria-current={active ? 'step' : undefined}
                onClick={() => { setError(''); setStep(index) }}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${active ? 'border-ink bg-ink text-white' : done ? 'border-line bg-white text-ink hover:bg-canvas' : 'border-line bg-canvas text-muted'}`}
              >
                0{index + 1} {label}
              </button>
            </li>
          )
        })}
      </ol>

      {current === 'Owner' ? (
        <fieldset className="mt-6 space-y-3">
          <legend className="text-lg font-semibold">Who runs the shop</legend>
          <p className="text-sm text-muted">This person signs in to the shop desk. The shop details come in the next steps.</p>
          <Field label="Owner name"><TextInput value={owner.name} onChange={setOwnerField('name')} autoComplete="name" required /></Field>
          <Field label="Email"><TextInput value={owner.email} onChange={setOwnerField('email')} type="email" autoComplete="email" required /></Field>
          <Field label="Mobile"><TextInput value={owner.phone} onChange={setOwnerField('phone')} inputMode="numeric" autoComplete="tel" required /></Field>
          <Field label="Password"><TextInput value={owner.password} onChange={setOwnerField('password')} type="password" autoComplete="new-password" minLength={8} required /></Field>
          <Field label="Confirm password"><TextInput value={owner.confirm} onChange={setOwnerField('confirm')} type="password" autoComplete="new-password" minLength={8} required /></Field>
        </fieldset>
      ) : null}

      {current === 'Shop' ? (
        <fieldset className="mt-6 space-y-3">
          <legend className="text-lg font-semibold">The shop customers will see</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Shop name"><TextInput value={shop.name} onChange={setShopField('name')} required /></Field>
            <Field label="Category">
              <SelectInput value={shop.category} onChange={setShopField('category')} required>
                <option value="">{categories.isLoading ? 'Loading categories…' : 'Select'}</option>
                {catalogue.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
              </SelectInput>
            </Field>
          </div>
          <Field label="What you sell">
            <TextArea value={shop.description} onChange={setShopField('description')} rows={3} placeholder="Everyday groceries, fresh bread, household basics…" required />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Shop phone"><TextInput value={shop.phone} onChange={setShopField('phone')} inputMode="numeric" required /></Field>
            <Field label="Shop email"><TextInput value={shop.email} onChange={setShopField('email')} type="email" /></Field>
            <Field label="GSTIN"><TextInput value={shop.gstin} onChange={setShopField('gstin')} autoCapitalize="characters" placeholder="Optional" /></Field>
            <Field label="Logo">
              <input type="file" accept="image/*" onChange={onLogo} className="w-full text-sm" />
            </Field>
          </div>
          {logoUrl ? <img src={logoUrl} alt="Shop logo preview" className="h-16 w-16 rounded-lg border border-line object-cover" /> : null}
        </fieldset>
      ) : null}

      {current === 'Address' ? (
        <fieldset className="mt-6 space-y-3">
          <legend className="text-lg font-semibold">Where the shop is</legend>
          <p className="text-sm text-muted">Customers find you by this address and the pin. The page only uses your location if you ask it to.</p>
          <Field label="Street address"><TextInput value={shop.address} onChange={setShopField('address')} required /></Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="City"><TextInput value={shop.city} onChange={setShopField('city')} required /></Field>
            <Field label="State"><TextInput value={shop.state} onChange={setShopField('state')} required /></Field>
            <Field label="PIN code"><TextInput value={shop.pinCode} onChange={setShopField('pinCode')} inputMode="numeric" required /></Field>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Shop pin</p>
            <Button variant="ghost" onClick={() => geo.request()}>Use current location</Button>
          </div>
          {geo.status === 'denied' ? <p className="text-sm text-danger">Location permission was denied. Drop a pin on the map instead.</p> : null}
          {geo.status === 'unavailable' ? <p className="text-sm text-danger">Location is unavailable. Drop a pin on the map instead.</p> : null}
          <LocationPicker value={coords} onChange={setCoords} label="Shop location" />
        </fieldset>
      ) : null}

      {current === 'Service' ? (
        <fieldset className="mt-6 space-y-4">
          <legend className="text-lg font-semibold">How orders leave the shop</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Opens"><TextInput type="time" value={shop.openingTime} onChange={setShopField('openingTime')} required /></Field>
            <Field label="Closes"><TextInput type="time" value={shop.closingTime} onChange={setShopField('closingTime')} required /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex gap-3 rounded-xl border border-line p-3 text-sm">
              <input type="checkbox" className="mt-1" checked={shop.pickupAvailable} onChange={setShopField('pickupAvailable')} />
              <span>
                <span className="block font-medium">Pickup</span>
                <span className="mt-1 block text-muted">Customers order ahead and collect it.</span>
              </span>
            </label>
            <label className="flex gap-3 rounded-xl border border-line p-3 text-sm">
              <input type="checkbox" className="mt-1" checked={shop.deliveryAvailable} onChange={setShopField('deliveryAvailable')} />
              <span>
                <span className="block font-medium">Delivery</span>
                <span className="mt-1 block text-muted">A partner brings it within your radius.</span>
              </span>
            </label>
          </div>
          {shop.deliveryAvailable ? (
            <Field label="Delivery radius (km)">
              <TextInput type="number" min="1" max="25" step="0.5" value={shop.deliveryRadius} onChange={setShopField('deliveryRadius')} required />
            </Field>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Earliest prep (minutes)"><TextInput type="number" min="5" max="180" value={shop.prepTimeMin} onChange={setShopField('prepTimeMin')} required /></Field>
            <Field label="Latest prep (minutes)"><TextInput type="number" min="5" max="240" value={shop.prepTimeMax} onChange={setShopField('prepTimeMax')} required /></Field>
          </div>
        </fieldset>
      ) : null}

      {current === 'Review' ? (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Check the application</h2>
          <p className="mt-1 text-sm text-muted">A new shop stays pending until an admin approves it. Customers only see it after that.</p>
          <dl className="mt-4 divide-y divide-line border border-line text-sm">
            {includeOwner ? <ReviewRow label="Owner" value={`${owner.name} · ${owner.email} · ${owner.phone}`} /> : null}
            <ReviewRow label="Shop" value={shop.name} />
            <ReviewRow label="Category" value={categoryName} />
            <ReviewRow label="About" value={shop.description} />
            <ReviewRow label="Contact" value={[shop.phone, shop.email, shop.gstin].filter(Boolean).join(' · ')} />
            <ReviewRow label="Address" value={`${shop.address}, ${shop.city}, ${shop.state} ${shop.pinCode}`} />
            <ReviewRow label="Hours" value={`${shop.openingTime} – ${shop.closingTime}`} />
            <ReviewRow
              label="Fulfilment"
              value={[
                shop.pickupAvailable ? 'Pickup' : null,
                shop.deliveryAvailable ? `Delivery within ${shop.deliveryRadius} km` : null,
                `Prep ${minutesLabel(shop.prepTimeMin, shop.prepTimeMax)}`,
              ].filter(Boolean).join(' · ')}
            />
          </dl>
          {logoUrl ? <img src={logoUrl} alt="" className="mt-4 h-16 w-16 rounded-lg border border-line object-cover" /> : null}
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-danger" role="alert">{error}</p> : null}
      <div className="mt-6 flex items-center justify-between gap-3">
        <Button variant="ghost" disabled={step === 0 || busy} onClick={() => { setError(''); setStep((index) => index - 1) }}>Back</Button>
        <Button type="submit" disabled={busy}>{current === 'Review' ? (busy ? 'Submitting…' : 'Submit application') : 'Continue'}</Button>
      </div>
    </form>
  )
}

function ReviewRow({ label, value }) {
  return (
    <div className="grid gap-1 px-4 py-3 sm:grid-cols-[140px_1fr]">
      <dt className="text-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
