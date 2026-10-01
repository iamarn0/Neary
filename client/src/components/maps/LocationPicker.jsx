import Map from './Map'

export default function LocationPicker({ value, onChange, label = 'Select a location' }) {
  const center = value?.length === 2 ? value : [88.41, 22.58]
  return (
    <div className="space-y-3">
      <Map
        className="h-64"
        center={center}
        zoom={13}
        markers={value?.length === 2 ? [{ coordinates: value, label: 'Pin', color: '#111827', ariaLabel: label }] : []}
        onSelect={onChange}
      />
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm text-muted">
          Longitude
          <input
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-ink"
            value={value?.[0] ?? ''}
            inputMode="decimal"
            aria-label="Longitude"
            onChange={(event) => onChange([Number(event.target.value), value?.[1] ?? center[1]])}
          />
        </label>
        <label className="text-sm text-muted">
          Latitude
          <input
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-ink"
            value={value?.[1] ?? ''}
            inputMode="decimal"
            aria-label="Latitude"
            onChange={(event) => onChange([value?.[0] ?? center[0], Number(event.target.value)])}
          />
        </label>
      </div>
      <p className="text-xs text-muted">Click the map or enter coordinates. Longitude is stored before latitude.</p>
    </div>
  )
}
