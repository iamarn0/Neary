import { Link } from 'react-router-dom'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useCart } from '../../features/cart/useCart'
import { formatINR } from '../../lib/format'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Media from '../../components/Media'

export default function CartPage() {
  usePageMeta('Cart · NEARE')
  const { query, update, enabled } = useCart()
  if (!enabled) {
    return <EmptyState title="Sign in to view your cart" body="Your cart stays with your NEARE account." action={<Link to="/login"><Button>Sign in</Button></Link>} />
  }
  const cart = query.data?.cart
  const subtotal = (cart?.items || []).reduce((sum, item) => sum + item.price * item.quantity, 0)
  if (!cart?.items?.length) {
    return <EmptyState title="Your cart is waiting." body="Add something from a nearby shop." action={<Link to="/explore"><Button>Start shopping</Button></Link>} />
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold">{cart.shop?.name}</h1>
        {cart.items.map((item) => (
          <article key={item.product} className="flex gap-3 rounded-2xl border border-line bg-white p-3">
            <Media src={item.image} alt="" className="h-16 w-16 rounded-lg" />
            <div className="flex-1">
              <h2 className="font-medium">{item.name}</h2>
              <p className="text-sm text-muted">{formatINR(item.price)} · {item.unit}</p>
              {!item.isAvailable ? <p className="text-sm text-danger">Unavailable in this quantity</p> : null}
              <div className="mt-2 flex items-center gap-2">
                <button type="button" aria-label="Decrease" className="h-8 w-8 rounded border border-line" onClick={() => update.mutate({ productId: item.product, quantity: item.quantity - 1 })}>−</button>
                <span>{item.quantity}</span>
                <button type="button" aria-label="Increase" className="h-8 w-8 rounded border border-line" onClick={() => update.mutate({ productId: item.product, quantity: item.quantity + 1 })}>+</button>
              </div>
            </div>
            <p className="text-sm font-medium">{formatINR(item.price * item.quantity)}</p>
          </article>
        ))}
      </section>
      <aside className="h-fit rounded-2xl border border-line bg-white p-5">
        <h2 className="font-semibold">Summary</h2>
        <p className="mt-3 flex justify-between text-sm"><span>Subtotal</span><span>{formatINR(subtotal)}</span></p>
        <p className="mt-1 text-xs text-muted">Delivery fee and tax are calculated at checkout.</p>
        <Link to="/checkout" className="mt-5 hidden md:block"><Button variant="brand" className="w-full">Checkout</Button></Link>
      </aside>
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-line bg-white p-3 md:hidden">
        <Link to="/checkout"><Button variant="brand" className="w-full">Checkout · {formatINR(subtotal)}</Button></Link>
      </div>
    </div>
  )
}
