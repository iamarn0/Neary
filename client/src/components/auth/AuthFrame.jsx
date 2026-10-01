import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'

export default function AuthFrame({ kicker, title, lede, notes, children }) {
  return (
    <section className="border-b border-line bg-white">
      <div className="mx-auto grid max-w-6xl lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[minmax(280px,0.9fr)_1.1fr]">
        <aside className="bg-ink px-5 py-10 text-white sm:px-8 lg:sticky lg:top-14 lg:flex lg:h-[calc(100vh-3.5rem)] lg:flex-col lg:justify-between lg:px-10 lg:py-12">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">{kicker}</p>
            <h1 className="mt-4 max-w-md font-display text-[clamp(2.1rem,4vw,3.5rem)] leading-[1.02] tracking-tight">{title}</h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/70">{lede}</p>
          </div>
          {notes ? <ul className="mt-10 space-y-3 border-t border-white/15 pt-6 text-sm text-white/75 lg:mt-0">{notes}</ul> : null}
        </aside>
        <div className="bg-canvas px-4 py-8 sm:px-8 lg:px-12 lg:py-12">{children}</div>
      </div>
    </section>
  )
}

export function AuthNote({ label, value }) {
  return (
    <li className="flex items-baseline justify-between gap-4">
      <span className="text-white/45">{label}</span>
      <span>{value}</span>
    </li>
  )
}

export function AuthField({ label, children }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</span>
      <span className="mt-2 block">{children}</span>
    </label>
  )
}

export function AuthInput(props) {
  return (
    <input
      {...props}
      className={`w-full border border-line bg-white px-3 py-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-ink ${props.className || ''}`}
    />
  )
}

export function AuthPassword({ name, autoComplete, minLength, required, value, onChange }) {
  const [visible, setVisible] = useState(false)
  return (
    <span className="relative block">
      <AuthInput
        name={name}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
        value={value}
        onChange={onChange}
        className="pr-16"
      />
      <button
        type="button"
        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium text-muted hover:text-ink"
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        <span className="sr-only">{visible ? 'Hide password' : 'Show password'}</span>
      </button>
    </span>
  )
}

export function AuthLinks({ children }) {
  return <p className="mt-5 text-sm text-muted">{children}</p>
}

export function AuthTextLink({ to, children }) {
  return <Link to={to} className="font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ink">{children}</Link>
}
