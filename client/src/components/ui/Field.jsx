export function Field({ label, children }) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      <div className="mt-1.5 font-normal">{children}</div>
    </label>
  )
}

export function TextInput(props) {
  return <input {...props} className={`w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none ${props.className || ''}`} />
}

export function SelectInput(props) {
  return <select {...props} className={`w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm ${props.className || ''}`} />
}

export function TextArea(props) {
  return <textarea {...props} className={`w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm ${props.className || ''}`} />
}
