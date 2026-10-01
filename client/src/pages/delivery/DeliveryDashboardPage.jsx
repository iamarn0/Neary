import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deliveryApi } from '../../services'
import { getSocket } from '../../lib/socket'
import { usePageMeta } from '../../hooks/usePageMeta'
import { greeting, formatDistance } from '../../lib/format'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'

export default function DeliveryDashboardPage() {
  usePageMeta('Delivery · NEARE')
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const dashboard = useQuery({ queryKey: ['delivery-dashboard'], queryFn: deliveryApi.dashboard, refetchInterval: 10000 })
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
