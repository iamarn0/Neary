import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deliveryApi } from '../../services'
import { getSocket } from '../../lib/socket'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useToast } from '../../context/ToastContext'
import { formatDistance, formatINR } from '../../lib/format'
import { useGeolocation } from '../../hooks/useGeolocation'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Map from '../../components/maps/Map'

export default function ActiveDeliveryPage() {
  usePageMeta('Active delivery · NEARE')
  const toast = useToast()
  const queryClient = useQueryClient()
  const offers = useQuery({ queryKey: ['delivery-offers'], queryFn: deliveryApi.offers, refetchInterval: 8000 })
  const activePreview = offers.data?.active
  const geo = useGeolocation({ watch: Boolean(activePreview), minInterval: 8000 })
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['delivery-offers'] })
    queryClient.invalidateQueries({ queryKey: ['delivery-dashboard'] })
  }
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return undefined
    socket.on('delivery:offer', refresh)
    socket.on('delivery:offer:taken', refresh)
    return () => {
      socket.off('delivery:offer', refresh)
      socket.off('delivery:offer:taken', refresh)
    }
  }, [queryClient])

  const accept = useMutation({ mutationFn: deliveryApi.accept, onSuccess: refresh, onError: (error) => toast.error(error.message) })
  const decline = useMutation({ mutationFn: deliveryApi.decline, onSuccess: refresh, onError: (error) => toast.error(error.message) })
  const pickup = useMutation({ mutationFn: deliveryApi.pickup, onSuccess: refresh, onError: (error) => toast.error(error.message) })
  const complete = useMutation({ mutationFn: deliveryApi.complete, onSuccess: refresh, onError: (error) => toast.error(error.message) })
  const active = offers.data?.active

  function shareLocation() {
    geo.request()
  }

  useEffect(() => {
    if (geo.status === 'allowed' && geo.coordinates && active?.deliveryId) {
      const payload = { longitude: geo.coordinates[0], latitude: geo.coordinates[1] }
      deliveryApi.location(active.deliveryId, payload).catch(() => {})
      getSocket()?.emit('delivery:location', { deliveryId: active.deliveryId, ...payload })
    }
  }, [geo.status, geo.coordinates, active?.deliveryId])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Active delivery</h1>
      {active ? (
        <article className="rounded-2xl border border-line bg-white p-5">
          <p className="text-sm text-muted">{active.orderNumber}</p>
          <h2 className="mt-1 text-xl font-semibold">{active.status === 'PICKED_UP' ? 'Navigate to customer' : 'Navigate to shop'}</h2>
          <p className="mt-2">{active.shopName} · {active.shopArea}</p>
          <p className="text-sm text-muted">
            {active.status === 'PICKED_UP' && active.customerAddress
              ? [active.customerAddress.flat, active.customerAddress.building, active.customerAddress.area, active.customerAddress.city].filter(Boolean).join(', ')
              : `Destination area: ${active.destinationArea || active.customerArea}`}
          </p>
          <p className="mt-1 text-sm">{formatDistance(active.distanceKm)} · {formatINR(active.earningsEstimate)}</p>
          <p className="mt-2 text-xs font-medium">{geo.status === 'allowed' ? 'Live location' : 'Location not shared'}</p>
          <div className="mt-4">
            <Map
              className="h-72"
              center={active.status === 'PICKED_UP' ? active.dropoff?.coordinates : active.pickup?.coordinates}
              markers={[
                { coordinates: active.pickup?.coordinates, label: 'Shop', color: '#111827' },
                { coordinates: active.dropoff?.coordinates, label: 'Customer', color: '#2563EB' },
              ]}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="ghost" onClick={shareLocation}>Share my location</Button>
            {active.status === 'ACCEPTED' ? <Button onClick={() => pickup.mutate(active.deliveryId)}>Mark as picked up</Button> : null}
            {active.status === 'PICKED_UP' ? <Button onClick={() => complete.mutate(active.deliveryId)}>Mark as delivered</Button> : null}
          </div>
          {geo.status === 'denied' ? <p className="mt-2 text-sm text-muted">Location permission was denied. You can still complete the delivery steps.</p> : null}
          {geo.status === 'unsupported' ? <p className="mt-2 text-sm text-muted">This browser cannot share location.</p> : null}
          {geo.status === 'timeout' || geo.status === 'unavailable' ? <p className="mt-2 text-sm text-muted">Location is unavailable right now.</p> : null}
        </article>
      ) : <EmptyState title="No active deliveries" body="You’re all caught up." />}

      <section>
        <h2 className="font-semibold">New deliveries</h2>
        <div className="mt-3 space-y-3">
          {(offers.data?.offers || []).map((offer) => (
            <article key={offer.deliveryId} className="rounded-2xl border border-line bg-white p-4">
              <p className="font-medium">{offer.shopName}</p>
              <p className="text-sm text-muted">{offer.shopArea} → {offer.destinationArea || offer.customerArea}</p>
              <p className="mt-1 text-sm">{formatDistance(offer.distanceKm)} · {formatINR(offer.earningsEstimate)} · {offer.deliveryType}</p>
              <div className="mt-3 flex gap-2">
                <Button onClick={() => accept.mutate(offer.deliveryId)}>Accept</Button>
                <Button variant="ghost" onClick={() => decline.mutate(offer.deliveryId)}>Decline</Button>
              </div>
            </article>
          ))}
          {!offers.data?.offers?.length ? <p className="text-sm text-muted">No new assignments.</p> : null}
        </div>
      </section>
    </div>
  )
}
