import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../services'
import { usePageMeta } from '../../hooks/usePageMeta'
import { formatINR } from '../../lib/format'

export default function AdminDashboardPage() {
  usePageMeta('Admin · NEARE')
  const dashboard = useQuery({ queryKey: ['admin-dashboard'], queryFn: adminApi.dashboard })
  const data = dashboard.data
  const cards = data ? [
    ['GMV', formatINR(data.gmv)],
    ['Orders', data.orders],
    ['Customers', data.customers],
    ['Shops', data.shops],
    ['Delivery partners', data.deliveryPartners],
    ['Active orders', data.activeOrders],
  ] : []
  return (
    <div>
      <h1 className="text-2xl font-semibold">Marketplace</h1>
      <p className="mt-1 text-sm text-muted">{data?.pendingShops || 0} shops and {data?.pendingPartners || 0} delivery partners waiting for approval</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-line bg-white p-4">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
