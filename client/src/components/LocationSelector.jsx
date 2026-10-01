import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { addressApi, geoApi } from '../services'
import { useGeolocation } from '../hooks/useGeolocation'
import { useLocationSelection } from '../context/LocationContext'
import Button from './ui/Button'
import { Field, TextInput } from './ui/Field'
import LocationPicker from './maps/LocationPicker'

export default function LocationSelector({ onDone }) {
  const { setLocation } = useLocationSelection()
  const geo = useGeolocation()
  const asked = useRef(false)
  const [query, setQuery] = useState('')
  const [places, setPlaces] = useState([])
  const [manualOpen, setManualOpen] = useState(false)
  const [manual, setManual] = useState({
    fullName: '',
    flat: '',
    building: '',
    area: '',
    city: 'Kolkata',
    state: 'West Bengal',
    pinCode: '',
    landmark: '',
    coordinates: null,
  })
  const [message, setMessage] = useState('')
  const addresses = useQuery({ queryKey: ['addresses'], queryFn: addressApi.list })
  const saved = [...(addresses.data?.addresses || [])].sort((a, b) => Number(b.isDefault) - Number(a.isDefault))

  useEffect(() => {
    if (!asked.current) return
    if (geo.status === 'allowed' && geo.coordinates) {
      asked.current = false
      setLocation({ label: 'Current location', coordinates: geo.coordinates, area: '', city: '' })
      onDone?.()
    }
    if (geo.status === 'denied') setMessage('Location permission was denied. Search or enter an address instead.')
    if (geo.status === 'unavailable' || geo.status === 'unsupported' || geo.status === 'timeout') {
      setMessage('Location is unavailable. Search or enter an address instead.')
    }
  }, [geo.status, geo.coordinates, setLocation, onDone])

  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) {
      setPlaces([])
      return undefined
    }
    const handle = setTimeout(() => {
      geoApi.suggest(term).then((result) => setPlaces(result.places || [])).catch(() => setPlaces([]))
    }, 250)
    return () => clearTimeout(handle)
  }, [query])

  function choose(place) {
    setLocation({
      label: place.label,
      area: place.area,
      city: place.city,
      state: place.state,
      coordinates: place.coordinates,
    })
    onDone?.()
  }

  function chooseAddress(address) {
    const coordinates = address.location?.coordinates
    if (!Array.isArray(coordinates) || coordinates.length !== 2) return
    setLocation({
      label: [address.area, address.city].filter(Boolean).join(', '),
      area: address.area,
      city: address.city,
      state: address.state,
      coordinates,
    })
    onDone?.()
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Where are you shopping from?</h2>
        <p className="mt-1 text-sm text-muted">Nearby shops are based on this location.</p>
      </div>
      <Button onClick={() => { asked.current = true; setMessage(''); geo.request() }} disabled={geo.status === 'loading'}>
        {geo.status === 'loading' ? 'Finding location…' : 'Use my current location'}
      </Button>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
      <div>
        <p className="text-sm font-medium">Saved addresses</p>
        {addresses.isLoading ? <p className="mt-2 text-sm text-muted">Loading addresses…</p> : null}
        {saved.length ? (
          <ul className="mt-2 max-h-40 space-y-2 overflow-auto">
            {saved.map((address) => {
              const ready = Array.isArray(address.location?.coordinates) && address.location.coordinates.length === 2
              return (
                <li key={address._id}>
                  <button
                    type="button"
                    disabled={!ready}
                    onClick={() => chooseAddress(address)}
                    className="w-full rounded-xl border border-line bg-white px-3 py-2 text-left text-sm hover:border-ink disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="font-medium">{address.area}{address.isDefault ? ' · Default' : ''}</span>
                    <span className="mt-0.5 block text-muted">{[address.flat, address.building, address.city, address.pinCode].filter(Boolean).join(', ')}</span>
                    {ready ? null : <span className="mt-0.5 block text-xs text-muted">Add a map pin before using this address.</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        ) : null}
        {addresses.isSuccess && !saved.length ? <p className="mt-2 text-sm text-muted">No saved addresses yet.</p> : null}
        <Link to="/addresses" onClick={() => onDone?.()} className="mt-2 inline-block text-sm text-info">Manage addresses</Link>
      </div>
      <Field label="Search for a location">
        <TextInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Salt Lake, Kolkata" />
      </Field>
      <ul className="space-y-1">
        {places.map((place) => (
          <li key={place.label}>
            <button type="button" className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-canvas" onClick={() => choose(place)}>
              {place.label}
            </button>
          </li>
        ))}
      </ul>
      <div className="space-y-3 border-t border-line pt-4">
        <button type="button" className="text-sm font-medium" onClick={() => setManualOpen((open) => !open)}>
          Enter address manually
        </button>
        {manualOpen ? <ManualAddress manual={manual} setManual={setManual} setMessage={setMessage} setLocation={setLocation} onDone={onDone} /> : null}
      </div>
    </div>
  )
}

function ManualAddress({ manual, setManual, setMessage, setLocation, onDone }) {
  return (
    <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['fullName', 'Name'],
            ['flat', 'Flat / House'],
            ['building', 'Building / Society'],
            ['area', 'Area'],
            ['city', 'City'],
            ['state', 'State'],
            ['pinCode', 'PIN'],
            ['landmark', 'Landmark'],
          ].map(([key, label]) => (
            <Field key={key} label={label}>
              <TextInput value={manual[key]} onChange={(event) => setManual({ ...manual, [key]: event.target.value })} />
            </Field>
          ))}
        </div>
        <LocationPicker value={manual.coordinates} onChange={(coordinates) => setManual({ ...manual, coordinates })} />
        <Button
          variant="ghost"
          onClick={() => {
            if (!manual.area || !manual.city || !manual.coordinates) {
              setMessage('Add an area, city, and a map pin.')
              return
            }
            setLocation({
              label: [manual.area, manual.city].filter(Boolean).join(', '),
              ...manual,
            })
            onDone?.()
          }}
        >
          Use this location
        </Button>
    </div>
  )
}
