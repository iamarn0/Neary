import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deliveryApi } from '../../services'
import { useAuth } from '../../context/AuthContext'
import { usePageMeta } from '../../hooks/usePageMeta'
import { formatINR, formatStatus } from '../../lib/format'
import { getSocket } from '../../lib/socket'

export default function DeliveryProfilePage() {
  usePageMeta('Delivery profile · NEARE')
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const dashboard = useQuery({ queryKey: ['delivery-dashboard'], queryFn: deliveryApi.dashboard })
  const online = useMutation({
    mutationFn: (isOnline) => deliveryApi.setOnline(isOnline),
    onSuccess: (result) => {
      getSocket()?.emit('delivery:presence', result.isOnline)
      queryClient.invalidateQueries({ queryKey: ['delivery-dashboard'] })
    },
  })
  const profile = user?.partnerProfile || {}
  const data = dashboard.data
  const approved = !data?.partnerStatus || data.partnerStatus === 'APPROVED'

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">{user?.name}</h1>
      <p className="mt-1 text-sm text-muted">{user?.email}</p>
      <p className="text-sm text-muted">{user?.phone}</p>
      <dl className="mt-6 divide-y divide-line border border-line bg-white text-sm">
        <Row label="Status" value={formatStatus(data?.partnerStatus || profile.partnerStatus || 'PENDING')} />
        <Row label="Area" value={[profile.area, profile.city].filter(Boolean).join(', ') || 'Not set'} />
        <Row label="Availability" value={data?.isOnline ? 'Online' : 'Offline'} />
        <Row label="Payout" value={data?.payoutLabel || profile.payoutLabel || 'Demo payout profile'} />
        <Row label="Today" value={formatINR(data?.todayEarnings || 0)} />
        <Row label="This week" value={formatINR(data?.weekEarnings || 0)} />
        <Row label="Total earnings" value={formatINR(data?.totalEarnings || 0)} />
      </dl>
      {data?.statusNote ? <p className="mt-4 text-sm text-muted">{data.statusNote}</p> : null}
      <button
        type="button"
        className="mt-5 inline-flex items-center gap-2 border border-line bg-white px-4 py-2 text-sm"
        disabled={online.isPending || (!approved && !data?.isOnline)}
        aria-pressed={Boolean(data?.isOnline)}
        onClick={() => online.mutate(!data?.isOnline)}
      >
        <span className={`h-2.5 w-2.5 rounded-full ${data?.isOnline ? 'bg-success' : 'bg-line'}`} aria-hidden="true" />
        {data?.isOnline ? 'Go offline' : 'Go online'}
      </button>
      {!approved ? <p className="mt-3 text-sm text-muted">You can go online after an admin approves this account.</p> : null}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}
