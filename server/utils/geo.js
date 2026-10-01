export function haversineKm(from, to) {
  const [lng1, lat1] = from
  const [lng2, lat2] = to
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(a))
}

export function metersToKm(meters) {
  return Math.round((meters / 1000) * 100) / 100
}

export function point(longitude, latitude) {
  return { type: 'Point', coordinates: [Number(longitude), Number(latitude)] }
}

export function assertCoordinates(longitude, latitude) {
  const lng = Number(longitude)
  const lat = Number(latitude)
  if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    const error = new Error('That location is not valid.')
    error.statusCode = 400
    return { error, lng, lat }
  }
  return { lng, lat }
}

export function interpolate(from, to, t) {
  const clamped = Math.min(1, Math.max(0, t))
  return [
    from[0] + (to[0] - from[0]) * clamped,
    from[1] + (to[1] - from[1]) * clamped,
  ]
}

export const PLACES = [
  { label: 'Salt Lake, Kolkata', area: 'Salt Lake', city: 'Kolkata', state: 'West Bengal', coordinates: [88.4103, 22.5801] },
  { label: 'New Town, Kolkata', area: 'New Town', city: 'Kolkata', state: 'West Bengal', coordinates: [88.481, 22.5892] },
  { label: 'Ballygunge, Kolkata', area: 'Ballygunge', city: 'Kolkata', state: 'West Bengal', coordinates: [88.3654, 22.528] },
  { label: 'Jadavpur, Kolkata', area: 'Jadavpur', city: 'Kolkata', state: 'West Bengal', coordinates: [88.3714, 22.4955] },
  { label: 'Tollygunge, Kolkata', area: 'Tollygunge', city: 'Kolkata', state: 'West Bengal', coordinates: [88.3468, 22.4983] },
  { label: 'Behala, Kolkata', area: 'Behala', city: 'Kolkata', state: 'West Bengal', coordinates: [88.311, 22.5012] },
  { label: 'Dum Dum, Kolkata', area: 'Dum Dum', city: 'Kolkata', state: 'West Bengal', coordinates: [88.4229, 22.6273] },
  { label: 'Park Street, Kolkata', area: 'Park Street', city: 'Kolkata', state: 'West Bengal', coordinates: [88.3514, 22.554] },
  { label: 'Rajarhat, Kolkata', area: 'Rajarhat', city: 'Kolkata', state: 'West Bengal', coordinates: [88.45, 22.619] },
  { label: 'Lake Town, Kolkata', area: 'Lake Town', city: 'Kolkata', state: 'West Bengal', coordinates: [88.402, 22.6018] },
  { label: 'Alipore, Kolkata', area: 'Alipore', city: 'Kolkata', state: 'West Bengal', coordinates: [88.331, 22.5255] },
]
