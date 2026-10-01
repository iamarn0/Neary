export function straightLine(from, to) {
  if (!from || !to) return []
  return [from, to]
}

export async function fetchRoute(from, to) {
  if (!from || !to) return []
  const base = import.meta.env.VITE_ROUTING_URL
  if (!base) return straightLine(from, to)
  try {
    const url = `${base}/route/v1/driving/${from[0]},${from[1]};${to[0]},${to[1]}?overview=full&geometries=geojson`
    const response = await fetch(url)
    if (!response.ok) throw new Error('route')
    const body = await response.json()
    const coordinates = body.routes?.[0]?.geometry?.coordinates
    if (!coordinates?.length) throw new Error('route')
    return coordinates
  } catch {
    return straightLine(from, to)
  }
}
