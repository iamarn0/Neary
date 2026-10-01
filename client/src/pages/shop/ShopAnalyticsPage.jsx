import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { shopOwnerApi } from '../../services'
import { usePageMeta } from '../../hooks/usePageMeta'
import { formatINR, formatStatus } from '../../lib/format'

export default function ShopAnalyticsPage() {
  usePageMeta('Analytics · NEARE')
  const analytics = useQuery({ queryKey: ['shop-analytics'], queryFn: shopOwnerApi.analytics })
  const data = analytics.data
  if (!data) return <p className="text-sm text-muted">Loading analytics…</p>
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        {[['Revenue', formatINR(data.revenue)], ['Orders', data.orders], ['Average order', formatINR(data.averageOrderValue)]].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-line bg-white p-4">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </article>
        ))}
      </div>
      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="font-semibold">Revenue over time</h2>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.revenueOverTime}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#E85D04" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-4">
          <h2 className="font-semibold">Best-selling products</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.bestSellers.map((item) => <li key={item.name} className="flex justify-between"><span>{item.name}</span><span>{item.quantity} sold</span></li>)}
            {!data.bestSellers.length ? <li className="text-muted">Completed orders will appear here.</li> : null}
          </ul>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <h2 className="font-semibold">Order status</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.statusDistribution.map((item) => <li key={item.status} className="flex justify-between"><span>{formatStatus(item.status)}</span><span>{item.count}</span></li>)}
          </ul>
        </div>
      </section>
    </div>
  )
}
