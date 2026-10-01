import { useQuery } from '@tanstack/react-query'
import { deliveryApi } from '../../services'
import { usePageMeta } from '../../hooks/usePageMeta'
import { formatINR } from '../../lib/format'

export default function EarningsPage() {
  usePageMeta('Earnings · NEARE')
  const earnings = useQuery({ queryKey: ['earnings'], queryFn: deliveryApi.earnings })
  const data = earnings.data
  return (
    <div>
      <h1 className="text-2xl font-semibold">Earnings</h1>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-line bg-white p-4"><p className="text-sm text-muted">Today</p><p className="text-2xl font-semibold">{formatINR(data?.todayEarnings || 0)}</p></article>
        <article className="rounded-2xl border border-line bg-white p-4"><p className="text-sm text-muted">This week</p><p className="text-2xl font-semibold">{formatINR(data?.weekEarnings || 0)}</p></article>
        <article className="rounded-2xl border border-line bg-white p-4"><p className="text-sm text-muted">All time</p><p className="text-2xl font-semibold">{formatINR(data?.totalEarnings || 0)}</p></article>
      </div>
      <p className="mt-4 text-sm text-muted">{data?.completed || 0} completed deliveries. Earnings are 70% of the delivery fee, with a ₹25 minimum, recorded when a trip is completed.</p>
    </div>
  )
}
