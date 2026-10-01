export function drawRoute(map, route) {
  const data = {
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates: route?.length > 1 ? route : [] },
  }
  if (!map.getSource('route')) {
    map.addSource('route', { type: 'geojson', data })
    map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      paint: { 'line-color': '#E85D04', 'line-width': 4, 'line-opacity': 0.8 },
    })
  } else {
    map.getSource('route').setData(data)
  }
}

export default function RouteLayer() {
  return null
}
