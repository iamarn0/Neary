import { useEffect, useState } from 'react'
import { useGeolocation } from '../../hooks/useGeolocation'
import LocationPicker from '../maps/LocationPicker'
import Button from '../ui/Button'
import { Field, TextInput } from '../ui/Field'

const PHONE = /^[6-9]\d{9}$/

export default function PartnerApplication({ onSubmit }) {
  const labels = ['Account', 'Area', 'Review']
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
    city: 'Kolkata',
    area: '',
  })
  const [coords, setCoords] = useState(null)
  const geo = useGeolocation()
  const current = labels[step]

  useEffect(() => {
    if (geo.coordinates) setCoords(geo.coordinates)
  }, [geo.coordinates])

  function setField(key) {
    return (event) => setForm((currentForm) => ({ ...currentForm, [key]: event.target.value }))
  }

  function validate(label) {
    if (label === 'Account') {
      if (form.name.trim().length < 2) return 'Enter your name.'
      if (!/\S+@\S+\.\S+/.test(form.email.trim())) return 'Enter a valid email.'
      if (!PHONE.test(form.phone.trim())) return 'Enter a 10-digit Indian mobile number.'
      if (form.password.length < 8) return 'Use at least 8 characters for the password.'
      if (form.password !== form.confirm) return 'Passwords do not match.'
    }
    if (label === 'Area') {
      if (form.city.trim().length < 2) return 'Enter the city you work in.'
      if (form.area.trim().length < 2) return 'Enter the neighbourhood you cover.'
      if (!coords || coords.length !== 2 || coords.some((value) => !Number.isFinite(Number(value)))) {
        return 'Drop a pin where you usually start.'
      }
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
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role: 'DELIVERY_PARTNER',
        city: form.city.trim(),
        area: form.area.trim(),
        longitude: Number(coords[0]),
        latitude: Number(coords[1]),
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
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

      {current === 'Account' ? (
        <fieldset className="mt-6 space-y-3">
          <legend className="text-lg font-semibold">Your partner account</legend>
          <p className="text-sm text-muted">This is how you sign in. An admin approves the account before you can go online. No identity documents are collected in this demo.</p>
          <Field label="Name"><TextInput value={form.name} onChange={setField('name')} autoComplete="name" required /></Field>
          <Field label="Email"><TextInput value={form.email} onChange={setField('email')} type="email" autoComplete="email" required /></Field>
          <Field label="Mobile"><TextInput value={form.phone} onChange={setField('phone')} inputMode="numeric" autoComplete="tel" required /></Field>
          <Field label="Password"><TextInput value={form.password} onChange={setField('password')} type="password" autoComplete="new-password" minLength={8} required /></Field>
          <Field label="Confirm password"><TextInput value={form.confirm} onChange={setField('confirm')} type="password" autoComplete="new-password" minLength={8} required /></Field>
        </fieldset>
      ) : null}

      {current === 'Area' ? (
        <fieldset className="mt-6 space-y-3">
          <legend className="text-lg font-semibold">Where you usually start</legend>
          <p className="text-sm text-muted">Offers stay inside about 8 km of this pin. Earnings in the demo use a payout profile, not a real bank account.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="City"><TextInput value={form.city} onChange={setField('city')} required /></Field>
            <Field label="Neighbourhood"><TextInput value={form.area} onChange={setField('area')} placeholder="Salt Lake" required /></Field>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Start pin</p>
            <Button variant="ghost" onClick={() => geo.request()}>Use current location</Button>
          </div>
          {geo.status === 'denied' ? <p className="text-sm text-danger">Location permission was denied. Drop a pin on the map instead.</p> : null}
          {geo.status === 'unavailable' || geo.status === 'unsupported' ? <p className="text-sm text-danger">Location is unavailable. Drop a pin on the map instead.</p> : null}
          <LocationPicker value={coords} onChange={setCoords} label="Usual start" />
        </fieldset>
      ) : null}

      {current === 'Review' ? (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Check your partner application</h2>
          <p className="mt-1 text-sm text-muted">Status starts as pending. You can go online after an admin approves it.</p>
          <dl className="mt-4 divide-y divide-line border border-line text-sm">
            <div className="grid gap-1 px-4 py-3 sm:grid-cols-[140px_1fr]"><dt className="text-muted">Partner</dt><dd>{form.name} · {form.email} · {form.phone}</dd></div>
            <div className="grid gap-1 px-4 py-3 sm:grid-cols-[140px_1fr]"><dt className="text-muted">Area</dt><dd>{form.area}, {form.city}</dd></div>
            <div className="grid gap-1 px-4 py-3 sm:grid-cols-[140px_1fr]"><dt className="text-muted">Payout</dt><dd>Demo payout profile</dd></div>
          </dl>
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-danger" role="alert">{error}</p> : null}
      <div className="mt-6 flex items-center justify-between gap-3">
        <Button variant="ghost" disabled={step === 0 || busy} onClick={() => { setError(''); setStep((index) => index - 1) }}>Back</Button>
        <Button type="submit" disabled={busy}>{current === 'Review' ? (busy ? 'Creating account…' : 'Submit application') : 'Continue'}</Button>
      </div>
    </form>
  )
}
