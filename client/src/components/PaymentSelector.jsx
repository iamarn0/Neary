const methods = [
  ['UPI', 'UPI'],
  ['CARD', 'Card'],
  ['COD', 'Cash on delivery'],
]

export default function PaymentSelector({ value, onChange }) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">Demo payment</legend>
      <p className="mt-1 text-sm text-muted">UPI, card, and cash on delivery are simulated. Card numbers are never collected.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {methods.map(([id, label]) => (
          <label key={id} className={`rounded-xl border px-3 py-3 text-sm ${value === id ? 'border-ink' : 'border-line bg-white'}`}>
            <input className="mr-2" type="radio" name="payment" checked={value === id} onChange={() => onChange(id)} />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
