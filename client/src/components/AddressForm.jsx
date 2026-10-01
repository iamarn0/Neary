import { Field, TextInput } from './ui/Field'
import LocationPicker from './maps/LocationPicker'

const empty = {
  fullName: '',
  phone: '',
  flat: '',
  building: '',
  area: '',
  city: 'Kolkata',
  state: 'West Bengal',
  pinCode: '',
  landmark: '',
  longitude: '',
  latitude: '',
  isDefault: false,
}

export { empty as emptyAddress }

export default function AddressForm({ value, onChange }) {
  const set = (key) => (event) => onChange({ ...value, [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value })
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Full name"><TextInput value={value.fullName} onChange={set('fullName')} required /></Field>
      <Field label="Phone"><TextInput value={value.phone} onChange={set('phone')} inputMode="numeric" required /></Field>
      <Field label="Flat / house no."><TextInput value={value.flat} onChange={set('flat')} required /></Field>
      <Field label="Building / society"><TextInput value={value.building} onChange={set('building')} /></Field>
      <Field label="Area"><TextInput value={value.area} onChange={set('area')} required /></Field>
      <Field label="City"><TextInput value={value.city} onChange={set('city')} required /></Field>
      <Field label="State"><TextInput value={value.state} onChange={set('state')} required /></Field>
      <Field label="PIN code"><TextInput value={value.pinCode} onChange={set('pinCode')} inputMode="numeric" required /></Field>
      <div className="sm:col-span-2">
        <Field label="Landmark"><TextInput value={value.landmark} onChange={set('landmark')} /></Field>
      </div>
      <div className="sm:col-span-2">
        <p className="mb-2 text-sm font-medium">Map location</p>
        <LocationPicker
          value={value.longitude !== '' && value.latitude !== '' ? [Number(value.longitude), Number(value.latitude)] : null}
          onChange={([longitude, latitude]) => onChange({ ...value, longitude, latitude })}
        />
      </div>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" checked={Boolean(value.isDefault)} onChange={set('isDefault')} />
        Use as default address
      </label>
    </div>
  )
}
