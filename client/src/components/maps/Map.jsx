import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { drawRoute } from './RouteLayer'
import { markerElement } from './MapMarker'

const styleUrl = import.meta.env.VITE_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty'

function circleRing(center, kilometers, steps = 72) {
  const [lng, lat] = center
  const angular = kilometers / 6371
  const lat1 = (lat * Math.PI) / 180
  const lng1 = (lng * Math.PI) / 180
  const coords = []
  for (let i = 0; i <= steps; i += 1) {
    const bearing = (i / steps) * Math.PI * 2
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angular) + Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing),
    )
    const lng2 = lng1 + Math.atan2(
      Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
    )
    coords.push([(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI])
  }
  return coords
}

function drawRadius(map, center, radiusKm) {
  const data = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [center && radiusKm ? circleRing(center, radiusKm) : []],
    },
  }
  if (!map.getSource('coverage-radius')) {
    map.addSource('coverage-radius', { type: 'geojson', data })
    map.addLayer({
      id: 'coverage-radius-fill',
      type: 'fill',
      source: 'coverage-radius',
      paint: { 'fill-color': '#E85D04', 'fill-opacity': 0.1 },
    })
    map.addLayer({
      id: 'coverage-radius-line',
      type: 'line',
      source: 'coverage-radius',
      paint: {
        'line-color': '#E85D04',
        'line-width': 1.5,
        'line-dasharray': [1.4, 1.4],
        'line-opacity': 0.95,
      },
    })
  } else {
    map.getSource('coverage-radius').setData(data)
  }
}

export default function Map({
  center = [88.41, 22.58],
  zoom = 12,
  markers = [],
  route = [],
  onSelect,
  className = 'h-72',
  bare = false,
  controls = true,
  interactive = true,
  radiusKm = null,
  radiusCenter = null,
  label = 'Map',
  fit = false,
  fitKey = '',
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const selectRef = useRef(onSelect)
  const initRef = useRef({ center, zoom, controls, interactive })
  const [failed, setFailed] = useState(!styleUrl)
  selectRef.current = onSelect

  useEffect(() => {
    if (!styleUrl || !containerRef.current) return undefined
    const initial = initRef.current
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: initial.center,
      zoom: initial.zoom,
      interactive: initial.interactive,
      attributionControl: true,
    })
    if (initial.controls) map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.on('error', () => setFailed(true))
    map.on('click', (event) => {
      selectRef.current?.([Number(event.lngLat.lng.toFixed(6)), Number(event.lngLat.lat.toFixed(6))])
    })
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !center || fit) return
    map.easeTo({ center, duration: 400 })
  }, [center, fit])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !fit) return undefined
    const points = markers.filter((item) => Array.isArray(item.coordinates) && item.coordinates.length === 2)
    if (points.length < 2) return undefined
    const bounds = new maplibregl.LngLatBounds()
    points.forEach((item) => bounds.extend(item.coordinates))
    const apply = () => map.fitBounds(bounds, { padding: 56, maxZoom: 13, duration: 0 })
    if (map.isStyleLoaded()) apply()
    else map.once('load', apply)
    return undefined
  }, [fit, fitKey])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return undefined
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = markers
      .filter((item) => Array.isArray(item.coordinates) && item.coordinates.length === 2)
      .map((item) => {
        const marker = new maplibregl.Marker({ element: markerElement(item), anchor: 'center' }).setLngLat(item.coordinates).addTo(map)
        const parent = marker.getElement()?.parentElement
        if (parent) parent.style.zIndex = item.active ? '5' : '1'
        return marker
      })
    return undefined
  }, [markers])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return undefined
    const draw = () => drawRoute(map, route)
    if (map.isStyleLoaded()) draw()
    else map.once('load', draw)
    return undefined
  }, [route])

  useEffect(() => {
    const map = mapRef.current
    const origin = radiusCenter || center
    if (!map || !radiusKm || !origin) return undefined
    const draw = () => drawRadius(map, origin, radiusKm)
    if (map.isStyleLoaded()) draw()
    else map.once('load', draw)
    return undefined
  }, [radiusKm, radiusCenter, center])

  const frame = bare ? '' : 'overflow-hidden rounded-xl border border-line'

  if (failed) {
    return (
      <div className={`grid place-items-center bg-[#F3F1EC] px-4 text-center text-sm text-muted ${frame} ${className}`}>
        Map tiles are unavailable. Location details still work without the map.
      </div>
    )
  }

  return <div ref={containerRef} className={`${frame} ${className}`} role="application" aria-label={label} />
}
