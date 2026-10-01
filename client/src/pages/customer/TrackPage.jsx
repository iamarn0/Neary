import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { orderApi } from '../../services'
import { getSocket } from '../../lib/socket'
import { usePageMeta } from '../../hooks/usePageMeta'
import { formatDistance, formatStatus } from '../../lib/format'
import OrderTimeline from '../../components/OrderTimeline'
import DeliveryTrackingMap from '../../components/maps/DeliveryTrackingMap'

export default function TrackPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const track = useQuery({ queryKey: ['track', id], queryFn: () => orderApi.track(id), refetchInterval: 15000 })
  usePageMeta(track.data ? `Track ${track.data.order.orderNumber} · NEARE` : 'Track order · NEARE')

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return undefined
    socket.emit('order:join', id)
    const refresh = () => queryClient.invalidateQueries({ queryKey: ['track', id] })
    socket.on('order:status', refresh)
    socket.on('delivery:location', refresh)
    return () => {
      socket.off('order:status', refresh)
      socket.off('delivery:location', refresh)
    }
  }, [id, queryClient])

  if (track.isLoading) return <p className="text-sm text-muted">Loading tracking…</p>
  if (track.isError) return <p className="text-sm">{track.error.message}</p>
  const { order, steps, delivery, demoTracking } = track.data
  const shop = order.shop?.location?.coordinates
  const customer = order.shippingAddress?.location?.coordinates
  const partner = delivery?.partnerLocation?.coordinates
  const arriving = delivery?.remainingKm != null ? Math.max(4, Math.round((delivery.remainingKm / 18) * 60)) : order.etaMax

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">{order.orderNumber}</h1>
        {order.fulfillmentMethod === 'DELIVERY' && order.orderStatus === 'OUT_FOR_DELIVERY' ? (
          <div>
            <p className="text-lg font-medium">Your delivery is on the way</p>
            <p className="text-sm text-muted">Arriving in ~{arriving} min</p>
            {delivery?.remainingKm != null ? <p className="text-sm text-muted">Delivery partner is {formatDistance(delivery.remainingKm)} away</p> : null}
          </div>
        ) : <p className="text-sm text-muted">{formatStatus(order.orderStatus)}</p>}
        {delivery?.partnerLocation ? (
          <p className="inline-flex rounded-full border border-line px-2.5 py-1 text-xs font-medium">
            {delivery.partnerLocation.demo ? 'Demo tracking' : 'Live'}
          </p>
        ) : null}
        {demoTracking && delivery?.partnerLocation?.demo ? (
          <p className="text-xs text-muted">Demo tracking moves the partner along the route for this portfolio demo. It is not a live GPS feed.</p>
        ) : null}
        {order.fulfillmentMethod === 'DELIVERY' ? (
          <DeliveryTrackingMap shop={shop} customer={customer} partner={partner} />
        ) : null}
      </section>
      <aside className="rounded-2xl border border-line bg-white p-5">
        <OrderTimeline steps={steps} status={order.orderStatus} />
      </aside>
    </div>
  )
}
