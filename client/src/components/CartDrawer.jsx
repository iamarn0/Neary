import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useCart } from '../features/cart/useCart'
import { formatINR } from '../lib/format'
import Button from './ui/Button'

export default function CartDrawer({ open, onClose }) {
  const reduce = useReducedMotion()
  const { query } = useCart()
  const cart = query.data?.cart
  const subtotal = (cart?.items || []).reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-40">
          <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close cart" onClick={onClose} />
          <motion.aside
            initial={reduce ? false : { x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduce ? undefined : { x: 24, opacity: 0 }}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-line bg-white p-5"
            aria-label="Cart"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Cart</h2>
              <button type="button" onClick={onClose} className="text-sm text-muted">Close</button>
            </div>
            <div className="mt-4 flex-1 space-y-3 overflow-auto">
              {(cart?.items || []).map((item) => (
                <div key={item.product} className="flex justify-between gap-3 text-sm">
                  <span>{item.name} × {item.quantity}</span>
                  <span>{formatINR(item.price * item.quantity)}</span>
                </div>
              ))}
              {!cart?.items?.length ? <p className="text-sm text-muted">Your cart is empty.</p> : null}
            </div>
            <div className="border-t border-line pt-4">
              <p className="flex justify-between text-sm"><span>Subtotal</span><span>{formatINR(subtotal)}</span></p>
              <Link to="/cart" onClick={onClose} className="mt-4 block">
                <Button className="w-full">Review cart</Button>
              </Link>
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
