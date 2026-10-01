import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { shopOwnerApi } from '../../services'
import { usePageMeta } from '../../hooks/usePageMeta'
import { formatINR, formatStatus } from '../../lib/format'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'

export default function ShopDashboardPage() {
  usePageMeta('Shop overview · NEARE')
  const dashboard = useQuery({ queryKey: ['shop-dashboard'], queryFn: shopOwnerApi.dashboard })
  if (dashboard.isError) {
    return <EmptyState title="Register your shop" body={dashboard.error.message} action={<Link to="/shop/register"><Button>Register shop</Button></Link>} />
  }
  const data = dashboard.data
  if (!data) return <p className="text-sm text-muted">Loading overview…</p>
  const cards = [
    ['Today’s orders', data.todayOrders],
    ['Today’s revenue', formatINR(data.todayRevenue)],
    ['Pending orders', data.pendingOrders],
    ['Products', data.products],
    ['Low stock', data.lowStock],
    ['Average order', formatINR(data.averageOrder)],
  ]
  return (
    <div>
      <h1 className="text-2xl font-semibold">{data.shop.name}</h1>
      <p className="mt-1 text-sm text-muted">{data.shop.approvalStatus === 'APPROVED' ? (data.shop.isOpen ? 'Open now' : 'Closed') : formatStatus(data.shop.approvalStatus)}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-line bg-white p-4">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </article>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link to="/shop/inventory"><Button>Add product</Button></Link>
        <Link to="/shop/orders"><Button variant="ghost">View orders</Button></Link>
        <Link to="/shop/settings"><Button variant="ghost">Edit shop</Button></Link>
      </div>
      {data.attention ? (
        <section className="mt-6">
          <h2 className="font-semibold">Orders requiring attention</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].map((status) => (
              <article key={status} className="border border-line bg-white px-4 py-3">
                <p className="text-xs text-muted">{formatStatus(status === 'PLACED' ? 'New' : status)}</p>
                <p className="text-2xl font-semibold">{data.attention[status] || 0}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {data.lowStockProducts?.length ? (
        <section className="mt-6">
          <h2 className="font-semibold">Low stock</h2>
          <ul className="mt-3 divide-y divide-line border border-line bg-white text-sm">
            {data.lowStockProducts.map((product) => (
              <li key={product._id} className="flex justify-between px-4 py-2"><span>{product.name}</span><span>{product.stock} left</span></li>
            ))}
          </ul>
        </section>
      ) : null}
      <section className="mt-6 rounded-2xl border border-line bg-white p-4">
        <h2 className="font-semibold">Order trend</h2>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.trend}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="orders" fill="#111827" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}
