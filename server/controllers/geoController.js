import { PLACES } from '../utils/geo.js'
import { asyncHandler, send } from '../utils/http.js'

export const suggest = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase()
  const local = PLACES.filter((place) => !q || place.label.toLowerCase().includes(q) || place.area.toLowerCase().includes(q))
    .slice(0, 8)
    .map((place) => ({
      label: place.label,
      area: place.area,
      city: place.city,
      state: place.state,
      coordinates: place.coordinates,
      source: 'local',
    }))

  if (q.length < 3 || !process.env.GEOCODING_URL) {
    send(res, { places: local })
    return
  }

  try {
    const url = new URL('/search', process.env.GEOCODING_URL)
    url.searchParams.set('format', 'json')
    url.searchParams.set('limit', '5')
    url.searchParams.set('countrycodes', 'in')
    url.searchParams.set('q', q)
    const response = await fetch(url, {
      headers: { 'User-Agent': 'NEARE/1.0 (portfolio demo)' },
      signal: AbortSignal.timeout(2500),
    })
    if (!response.ok) throw new Error('geocoder')
    const rows = await response.json()
    const remote = rows.map((row) => ({
      label: row.display_name,
      area: row.address?.suburb || row.address?.neighbourhood || row.address?.city_district || '',
      city: row.address?.city || row.address?.town || row.address?.state_district || '',
      state: row.address?.state || '',
      coordinates: [Number(row.lon), Number(row.lat)],
      source: 'geocoder',
    }))
    const seen = new Set(local.map((place) => place.label))
    send(res, { places: [...local, ...remote.filter((place) => !seen.has(place.label))].slice(0, 8) })
  } catch {
    send(res, { places: local })
  }
})
