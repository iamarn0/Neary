import { useQuery } from '@tanstack/react-query'
import { deliveryApi } from '../../services'
import { usePageMeta } from '../../hooks/usePageMeta'
import EmptyState from '../../components/ui/EmptyState'

export default function DeliveryHistoryPage() {
  usePageMeta('Delivery history · NEARE')
  const history = useQuery({ queryKey: ['delivery-history'], queryFn: deliveryApi.history })
  const rows = history.data?.deliveries || []
  return (
    <div>
      <h1 className="text-2xl font-semibold">History</h1>
      {rows.length ? (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={row._id} className="rounded-2xl border border-line bg-white p-4 text-sm">
              <p className="font-medium">{row.order?.orderNumber}</p>
              <p className="text-muted">{row.order?.shop?.name} · ₹{row.earnings} earned</p>
            </li>
          ))}
        </ul>
      ) : <div className="mt-4"><EmptyState title="No completed deliveries" body="Finished trips will be listed here." /></div>}
    </div>
  )
}
