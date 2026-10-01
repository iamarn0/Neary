import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { addressApi, orderApi } from '../../services'
import { useLocationSelection } from '../../context/LocationContext'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useToast } from '../../context/ToastContext'
import PaymentSelector from '../../components/PaymentSelector'
import { formatINR } from '../../lib/format'
import Button from '../../components/ui/Button'
import { TextArea } from '../../components/ui/Field'

export default function CheckoutPage() {
  usePageMeta('Checkout · NEARE')
  const navigate = useNavigate()
  const toast = useToast()
  const { location } = useLocationSelection()
  const addresses = useQuery({ queryKey: ['addresses'], queryFn: addressApi.list })
  const [addressId, setAddressId] = useState('')
  const [method, setMethod] = useState('DELIVERY')
  const [payment, setPayment] = useState('UPI')
  const [notes, setNotes] = useState('')
  const selected = addressId || addresses.data?.addresses?.find((item) => item.isDefault)?._id || addresses.data?.addresses?.[0]?._id
  const payload = useMemo(() => ({
    fulfillmentMethod: method,
    addressId: selected,
    paymentMethod: payment,
    notes,
    coordinates: location?.coordinates,
  }), [method, selected, payment, notes, location])

  const quote = useQuery({
    queryKey: ['quote', method, selected, location?.coordinates],
    queryFn: () => orderApi.quote(payload),
    enabled: method === 'PICKUP' || Boolean(selected),
  })
  const place = useMutation({
    mutationFn: () => orderApi.create(payload),
    onSuccess: (result) => navigate(`/orders/${result.order._id}`, { state: { confirmed: true } }),
    onError: (error) => toast.error(error.message),
  })
  const summary = quote.data?.quote

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-6">
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <fieldset>
          <legend className="text-sm font-medium">Fulfillment</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {[['DELIVERY', 'Delivery'], ['PICKUP', 'Pickup']].map(([id, label]) => (
              <label key={id} className={`rounded-xl border px-3 py-3 text-sm ${method === id ? 'border-ink' : 'border-line bg-white'}`}>
                <input className="mr-2" type="radio" name="fulfillment" checked={method === id} onChange={() => setMethod(id)} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        {method === 'DELIVERY' ? (
          <div>
            <h2 className="text-sm font-medium">Delivery address</h2>
            <div className="mt-3 space-y-2">
              {(addresses.data?.addresses || []).map((address) => (
                <label key={address._id} className={`block rounded-xl border p-3 text-sm ${selected === address._id ? 'border-ink' : 'border-line bg-white'}`}>
                  <input className="mr-2" type="radio" name="address" checked={selected === address._id} onChange={() => setAddressId(address._id)} />
                  {address.fullName}, {address.flat}, {address.area}, {address.city} {address.pinCode}
                </label>
              ))}
              {!addresses.data?.addresses?.length ? <p className="text-sm text-muted">Add an address before delivery checkout.</p> : null}
            </div>
            <Button variant="ghost" className="mt-3" onClick={() => navigate('/addresses')}>Manage addresses</Button>
          </div>
        ) : (
          <div className="rounded-xl border border-line bg-white p-4 text-sm">
            <p className="font-medium">Pickup</p>
            <p className="mt-1 text-muted">{summary?.shippingAddress?.flat}</p>
            <p className="mt-2 text-muted">Collect from the shop counter. A pickup code appears when the order is ready.</p>
            {summary ? <p className="mt-2">Ready in about {summary.eta.min}–{summary.eta.max} min</p> : null}
          </div>
        )}
        <PaymentSelector value={payment} onChange={setPayment} />
        <label className="block text-sm font-medium">
          Notes
          <TextArea className="mt-2" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
      </section>
      <aside className="h-fit rounded-2xl border border-line bg-white p-5">
        <h2 className="font-semibold">Bill</h2>
        {quote.isError ? <p className="mt-3 text-sm text-danger">{quote.error.message}</p> : null}
        {summary ? (
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatINR(summary.subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Delivery fee</dt><dd>{formatINR(summary.deliveryFee)}</dd></div>
            <div className="flex justify-between"><dt>Tax</dt><dd>{formatINR(summary.tax)}</dd></div>
            <div className="flex justify-between font-semibold"><dt>Total</dt><dd>{formatINR(summary.total)}</dd></div>
            {method === 'DELIVERY' ? <p className="text-muted">Estimated {summary.eta.min}–{summary.eta.max} min</p> : null}
          </dl>
        ) : <p className="mt-3 text-sm text-muted">Choose fulfillment to see the total.</p>}
        <Button className="mt-5 w-full" variant="brand" disabled={!summary || place.isPending} onClick={() => place.mutate()}>
          Place order
        </Button>
      </aside>
    </div>
  )
}
