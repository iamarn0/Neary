import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deliveryApi } from '../../services'
import { getSocket } from '../../lib/socket'
import { usePageMeta } from '../../hooks/usePageMeta'
import { greeting, formatDistance, formatINR } from '../../lib/format'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { useToast } from '../../context/ToastContext'

export default function DeliveryDashboardPage() {
  usePageMeta('Delivery · NEARE')
  const { user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const dashboard = useQuery({ queryKey: ['delivery-dashboard'], queryFn: deliveryApi.dashboard, refetchInterval: 10000 })
  const offers = useQuery({ queryKey: ['delivery-offers'], queryFn: deliveryApi.offers, refetchInterval: 8000 })
  const accept = useMutation({
    mutationFn: deliveryApi.accept,
    onSuccess: () => {
      toast.success('Delivery accepted')
      queryClient.invalidateQueries({ queryKey: ['delivery-offers'] })
      queryClient.invalidateQueries({ queryKey: ['delivery-dashboard'] })
    },
    onError: (error) => toast.error(error.message),
  })
  const online = useMutation({
    mutationFn: (isOnline) => deliveryApi.setOnline(isOnline),
    onSuccess: (result) => {
      getSocket()?.emit('delivery:presence', result.isOnline)
      queryClient.invalidateQueries({ queryKey: ['delivery-dashboard'] })
    },
  })
  const data = dashboard.data
  return (
    <div>
      <h1 className="text-2xl font-semibold">{greeting()}</h1>
      <p className="mt-1 text-sm text-muted">{user?.name}</p>
      {user?.partnerProfile?.area ? (
        <p className="mt-1 text-sm text-muted">
          {user.partnerProfile.area}, {user.partnerProfile.city}
          {data?.payoutLabel ? ` · ${data.payoutLabel}` : ''}
        </p>
      ) : null}
      {data?.partnerStatus && data.partnerStatus !== 'APPROVED' ? (
        <p className="mt-3 rounded-lg border border-line bg-white px-3 py-2 text-sm">
          Application status: {data.partnerStatus.toLowerCase()}. You can go online after an admin approves the account.
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted">{data?.isOnline ? "You're online and available for delivery requests." : "You're offline. Go online to receive nearby offers."}</p>
      )}
      <button
        type="button"
        disabled={online.isPending || (data?.partnerStatus && data.partnerStatus !== 'APPROVED' && !data?.isOnline)}
        onClick={() => online.mutate(!data?.isOnline)}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm"
        aria-pressed={Boolean(data?.isOnline)}
      >
        <span className={`h-2.5 w-2.5 rounded-full ${data?.isOnline ? 'bg-success' : 'bg-line'}`} />
        {data?.isOnline ? 'Online' : 'Offline'}
      </button>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-line bg-white p-4"><p className="text-sm text-muted">Today’s deliveries</p><p className="text-2xl font-semibold">{data?.todayDeliveries ?? '—'}</p></article>
        <article className="rounded-2xl border border-line bg-white p-4"><p className="text-sm text-muted">Today’s earnings</p><p className="text-2xl font-semibold">₹{data?.todayEarnings ?? '—'}</p></article>
        <article className="rounded-2xl border border-line bg-white p-4"><p className="text-sm text-muted">Open offers</p><p className="text-2xl font-semibold">{data?.openOffers ?? '—'}</p></article>
      </div>
      <section className="mt-6">
        <h2 className="font-semibold">Delivery offers</h2>
        {data?.isOnline && offers.data?.offers?.length ? (
          <ul className="mt-3 space-y-3">
            {offers.data.offers.map((offer) => (
              <li key={offer.deliveryId} className="border border-line bg-white p-4">
                <p className="font-medium">{offer.shopName}</p>
                <p className="mt-1 text-sm text-muted">Pickup: {offer.shopArea}</p>
                <p className="text-sm text-muted">Drop area: {offer.destinationArea}</p>
                <p className="mt-2 text-sm">{formatDistance(offer.distanceKm)} · Estimated earnings {formatINR(offer.earningsEstimate)}</p>
                <Button className="mt-3" disabled={accept.isPending} onClick={() => accept.mutate(offer.deliveryId)}>Accept</Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">{data?.isOnline ? 'No nearby offers right now.' : 'Go online to receive delivery requests.'}</p>
        )}
      </section>
      <section className="mt-6">
        <h2 className="font-semibold">Active delivery</h2>
        {data?.active ? (
          <article className="mt-3 rounded-2xl border border-line bg-white p-4">
            <p className="font-medium">{data.active.shopName}</p>
            <p className="text-sm text-muted">→ {data.active.customerArea}</p>
            <p className="mt-1 text-sm">{formatDistance(data.active.distanceKm)}</p>
            <Link to="/delivery/active" className="mt-3 inline-block"><Button>Continue</Button></Link>
          </article>
        ) : <div className="mt-3"><EmptyState title="No active deliveries" body="You’re all caught up." /></div>}
      </section>
    </div>
  )
}
