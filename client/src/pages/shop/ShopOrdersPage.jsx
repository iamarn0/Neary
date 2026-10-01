import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { shopOwnerApi } from '../../services'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useToast } from '../../context/ToastContext'
import { formatINR, formatStatus } from '../../lib/format'
import { billParty, billWhen, downloadBill, printBill } from '../../lib/billReceipt'
import Media from '../../components/Media'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { TextInput } from '../../components/ui/Field'

const tabs = ['', 'PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'BILLED', 'DELIVERED', 'PICKED_UP', 'CANCELLED']

export default function ShopOrdersPage() {
  usePageMeta('Shop orders · NEARE')
  const toast = useToast()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')
  const [code, setCode] = useState('')
  const [selected, setSelected] = useState(null)
  const orders = useQuery({ queryKey: ['shop-orders', status], queryFn: () => shopOwnerApi.orders(status) })
  const shop = useQuery({ queryKey: ['shop-mine'], queryFn: shopOwnerApi.mine })
  const shopRecord = shop.data?.shop
  const act = useMutation({
    mutationFn: ({ id, action, pickupCode }) => shopOwnerApi.act(id, { action, pickupCode }),
    onSuccess: (result) => {
      toast.success(result?.message || 'Updated')
      queryClient.invalidateQueries({ queryKey: ['shop-orders'] })
      queryClient.invalidateQueries({ queryKey: ['shop-dashboard'] })
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <div>
      <h1 className="text-2xl font-semibold">Orders</h1>
      <div className="mt-4 flex gap-2 overflow-auto">
        {tabs.map((tab) => (
          <button key={tab || 'all'} type="button" onClick={() => setStatus(tab)} className={`rounded-lg border px-3 py-2 text-sm ${status === tab ? 'border-ink bg-ink text-white' : 'border-line bg-white'}`}>
            {tab ? formatStatus(tab) : 'All'}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {(orders.data?.orders || []).map((order) => (
          <article key={order._id} className="rounded-2xl border border-line bg-white p-4">
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-medium">{order.orderNumber}</p>
                <p className="text-sm text-muted">{order.customer?.name || order.customerName || 'Walk-in'} · {formatStatus(order.fulfillmentMethod)} · {formatINR(order.total)}</p>
              </div>
              <p className="text-sm">{formatStatus(order.orderStatus)}</p>
            </div>
            <ul className="mt-2 text-sm text-muted">
              {order.items.map((item) => <li key={item.name}>{item.name} × {item.quantity}</li>)}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => setSelected(order)}>Details</Button>
              <Button variant="ghost" onClick={() => printBill(shopRecord, order)}>Print</Button>
              <Button variant="ghost" onClick={() => downloadBill(shopRecord, order)}>Download</Button>
              {order.orderStatus === 'PLACED' ? (
                <>
                  <Button onClick={() => act.mutate({ id: order._id, action: 'accept' })}>Accept</Button>
                  <Button variant="danger" onClick={() => act.mutate({ id: order._id, action: 'reject' })}>Reject</Button>
                </>
              ) : null}
              {order.orderStatus === 'ACCEPTED' ? <Button onClick={() => act.mutate({ id: order._id, action: 'prepare' })}>Start preparing</Button> : null}
              {order.orderStatus === 'PREPARING' ? <Button onClick={() => act.mutate({ id: order._id, action: 'ready' })}>Mark ready</Button> : null}
              {order.orderStatus === 'READY' && order.fulfillmentMethod === 'DELIVERY' ? <Button onClick={() => act.mutate({ id: order._id, action: 'assign' })}>Assign delivery</Button> : null}
              {order.orderStatus === 'READY' && order.fulfillmentMethod === 'PICKUP' ? (
                <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); act.mutate({ id: order._id, action: 'pickup', pickupCode: code }) }}>
                  <TextInput value={code} onChange={(event) => setCode(event.target.value)} placeholder="Pickup code" aria-label="Pickup code" />
                  <Button type="submit">Mark picked up</Button>
                </form>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      <Modal open={Boolean(selected)} title={selected?.orderNumber} onClose={() => setSelected(null)} className="max-w-lg max-h-[85vh] overflow-auto">
        {selected ? <BillDetail shop={shopRecord} order={selected} /> : null}
      </Modal>
    </div>
  )
}

function BillDetail({ shop, order }) {
  const party = billParty(order)
  const rows = [
    ['Subtotal', order.subtotal],
    order.deliveryFee ? ['Delivery', order.deliveryFee] : null,
    order.discount ? ['Discount', order.discount] : null,
    ['Tax', order.tax],
  ].filter(Boolean)

  return (
    <div>
      <p className="text-sm font-medium">{shop?.name}</p>
      <p className="text-xs text-muted">{[shop?.address, shop?.city, shop?.state, shop?.pinCode].filter(Boolean).join(', ')}</p>
      <p className="text-xs text-muted">{[shop?.phone, shop?.gstin ? `GSTIN ${shop.gstin}` : ''].filter(Boolean).join(' · ')}</p>
      <p className="mt-3 text-sm">{party.name}{party.phone ? ` · ${party.phone}` : ''}</p>
      <p className="text-xs text-muted">{billWhen(order)} · {formatStatus(order.fulfillmentMethod)} · {formatStatus(order.paymentMethod)} · {formatStatus(order.paymentStatus)}</p>
      <table className="mt-4 w-full text-left text-sm">
        <thead className="border-b border-line text-xs text-muted">
          <tr>
            <th className="py-2 font-medium">Item</th>
            <th className="py-2 text-right font-medium">Qty</th>
            <th className="py-2 text-right font-medium">Rate</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, index) => (
            <tr key={`${item.name}-${index}`} className="border-b border-line">
              <td className="py-2">
                <span className="flex items-center gap-2">
                  <Media src={item.image} alt="" className="h-8 w-8 shrink-0 rounded-md" />
                  <span>
                    {item.name}
                    {item.unit ? <span className="block text-xs text-muted">{item.unit}</span> : null}
                  </span>
                </span>
              </td>
              <td className="py-2 text-right">{item.quantity}</td>
              <td className="py-2 text-right">{formatINR(item.price)}</td>
              <td className="py-2 text-right">{formatINR(item.price * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="mt-3 space-y-1 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between">
            <dt className="text-muted">{label}</dt>
            <dd>{formatINR(value)}</dd>
          </div>
        ))}
        <div className="flex justify-between border-t border-line pt-2 font-medium">
          <dt>Total</dt>
          <dd>{formatINR(order.total)}</dd>
        </div>
      </dl>
      {order.notes ? <p className="mt-3 text-sm text-muted">{order.notes}</p> : null}
      <div className="mt-4 flex gap-2">
        <Button onClick={() => printBill(shop, order)}>Print</Button>
        <Button variant="ghost" onClick={() => downloadBill(shop, order)}>Download</Button>
      </div>
    </div>
  )
}
