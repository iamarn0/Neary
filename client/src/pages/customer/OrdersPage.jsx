import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { orderApi } from '../../services'
import { usePageMeta } from '../../hooks/usePageMeta'
import { formatINR, formatStatus } from '../../lib/format'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonList } from '../../components/ui/Skeleton'

export default function OrdersPage() {
  usePageMeta('Orders · NEARE')
  const orders = useQuery({ queryKey: ['orders'], queryFn: orderApi.list })
  if (orders.isLoading) return <SkeletonList />
  if (!orders.data?.orders?.length) {
    return <EmptyState title="You haven't placed an order yet." body="Explore nearby shops and start a cart from one store." action={<Link to="/explore" className="text-sm font-medium text-info">Explore nearby</Link>} />
  }
  return (
    <div>
      <h1 className="text-2xl font-semibold">Orders</h1>
      <div className="mt-4 space-y-3">
        {orders.data.orders.map((order) => (
          <Link key={order._id} to={`/orders/${order._id}`} className="block rounded-2xl border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{order.orderNumber}</p>
                <p className="text-sm text-muted">{order.shop?.name}</p>
              </div>
              <p className="text-sm">{formatINR(order.total)}</p>
            </div>
            <p className="mt-2 text-sm text-muted">{formatStatus(order.orderStatus)} · {formatStatus(order.fulfillmentMethod)}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
