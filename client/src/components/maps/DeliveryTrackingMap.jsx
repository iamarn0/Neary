import { useEffect, useState } from 'react'
import Map from './Map'
import { fetchRoute } from '../../lib/maps/routing'

export default function DeliveryTrackingMap({ shop, customer, partner, className = 'h-80' }) {
  const [route, setRoute] = useState([])

  useEffect(() => {
    let cancelled = false
    const from = partner || shop
    if (!from || !shop || !customer) return undefined
    fetchRoute(from, customer).then((coordinates) => {
      if (!cancelled) setRoute(coordinates)
    })
    return () => {
      cancelled = true
    }
  }, [shop, customer, partner])

  if (!shop || !customer) return null

  return (
    <Map
      className={className}
      center={partner || shop}
      zoom={13}
      route={route}
      markers={[
        { coordinates: shop, label: 'Shop', color: '#111827', ariaLabel: 'Shop' },
        partner ? { coordinates: partner, label: 'Partner', color: '#E85D04', ariaLabel: 'Delivery partner' } : null,
        { coordinates: customer, label: 'You', color: '#2563EB', ariaLabel: 'Customer' },
      ].filter(Boolean)}
    />
  )
}
