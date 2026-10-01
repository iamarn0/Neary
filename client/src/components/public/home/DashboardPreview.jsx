import { sampleOrders } from './homeData'

const metrics = [
  { label: "Today's orders", value: '24' },
  { label: 'Revenue', value: '₹18,420' },
  { label: 'Products', value: '126' },
  { label: 'Low stock', value: '7' },
]

export default function DashboardPreview() {
  return (
    <div className="border border-line bg-white" aria-label="Sample shop desk">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="text-sm font-medium">Shop desk</p>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Sample</p>
      </div>
      <div className="flex gap-px overflow-x-auto bg-line sm:grid sm:grid-cols-4 sm:overflow-visible">
        {metrics.map((item) => (
          <div key={item.label} className="min-w-[9.5rem] flex-1 bg-white px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{item.label}</p>
            <p className="font-display mt-2 text-3xl tracking-tight">{item.value}</p>
          </div>
        ))}
      </div>
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Sample orders on the shop desk</caption>
        <tbody>
          {sampleOrders.map((order) => (
            <tr key={order.shop} className="border-t border-line">
              <th scope="row" className="px-4 py-3 font-medium">{order.shop}</th>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 ${order.tone === 'brand' ? 'bg-brand' : 'bg-info'}`} aria-hidden="true" />
                  {order.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{order.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
