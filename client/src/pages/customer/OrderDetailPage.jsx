import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { orderApi, reviewApi } from '../../services'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useToast } from '../../context/ToastContext'
import { formatINR, formatStatus } from '../../lib/format'
import OrderTimeline from '../../components/OrderTimeline'
import Button from '../../components/ui/Button'
import { Field, TextArea } from '../../components/ui/Field'

const deliverySteps = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED']
const pickupSteps = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP']

export default function OrderDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const order = useQuery({ queryKey: ['order', id], queryFn: () => orderApi.get(id) })
  const cancel = useMutation({
    mutationFn: () => orderApi.cancel(id),
    onSuccess: () => {
      toast.success('Order cancelled')
      queryClient.invalidateQueries({ queryKey: ['order', id] })
    },
    onError: (error) => toast.error(error.message),
  })
  const review = useMutation({
    mutationFn: () => reviewApi.create({ orderId: id, rating: Number(rating), comment }),
    onSuccess: () => toast.success('Review saved'),
    onError: (error) => toast.error(error.message),
  })
  usePageMeta(order.data ? `${order.data.order.orderNumber} · NEARE` : 'Order · NEARE')
  if (order.isLoading) return <p className="text-sm text-muted">Loading order…</p>
  if (order.isError) return <p className="text-sm">{order.error.message}</p>
  const record = order.data.order
  const steps = record.fulfillmentMethod === 'PICKUP' ? pickupSteps : deliverySteps
  const done = ['DELIVERED', 'PICKED_UP'].includes(record.orderStatus)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <section>
        {location.state?.confirmed ? (
          <div className="mb-4 rounded-2xl border border-line bg-white p-5">
            <p className="text-sm text-success">Order confirmed</p>
            <h1 className="mt-1 text-2xl font-semibold">{record.orderNumber}</h1>
            <p className="mt-2 text-sm">{record.shop?.name} · {formatINR(record.total)}</p>
            <p className="text-sm text-muted">{formatStatus(record.fulfillmentMethod)} · {record.etaMin}–{record.etaMax} min</p>
            <p className="mt-2 text-xs text-muted">{record.paymentNote}</p>
          </div>
        ) : <h1 className="text-2xl font-semibold">{record.orderNumber}</h1>}
        <p className="mt-2 text-sm text-muted">{record.shop?.name}</p>
        <ul className="mt-4 space-y-2 text-sm">
          {record.items.map((item) => (
            <li key={item.name} className="flex justify-between"><span>{item.name} × {item.quantity}</span><span>{formatINR(item.price * item.quantity)}</span></li>
          ))}
        </ul>
        <p className="mt-4 text-sm">Total {formatINR(record.total)} · {record.paymentMethod} · {formatStatus(record.paymentStatus)}</p>
        {record.pickupCode ? (
          <div className="mt-4 rounded-xl border border-line bg-white p-4">
            <p className="text-sm">Ready for pickup</p>
            <p className="mt-1 font-medium">{record.shop?.name}</p>
            <p className="mt-2 text-sm text-muted">Pickup code</p>
            <p className="text-3xl font-semibold tracking-widest">{record.pickupCode}</p>
          </div>
        ) : null}
        {['PLACED', 'ACCEPTED'].includes(record.orderStatus) ? (
          <Button variant="danger" className="mt-4" onClick={() => cancel.mutate()}>Cancel order</Button>
        ) : null}
        {record.fulfillmentMethod === 'DELIVERY' ? (
          <Link to={`/orders/${record._id}/track`} className="mt-4 block"><Button>Track order</Button></Link>
        ) : null}
        {done ? (
          <form className="mt-6 space-y-3" onSubmit={(event) => { event.preventDefault(); review.mutate() }}>
            <h2 className="font-semibold">Review this order</h2>
            <Field label="Rating">
              <select className="w-full rounded-lg border border-line px-3 py-2" value={rating} onChange={(event) => setRating(event.target.value)}>
                {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </Field>
            <Field label="Comment"><TextArea value={comment} onChange={(event) => setComment(event.target.value)} rows={3} /></Field>
            <Button type="submit">Submit review</Button>
          </form>
        ) : null}
      </section>
      <aside className="rounded-2xl border border-line bg-white p-5">
        <OrderTimeline steps={steps} status={record.orderStatus} />
      </aside>
    </div>
  )
}
