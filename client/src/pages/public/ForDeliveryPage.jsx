import { Link } from 'react-router-dom'
import { usePageMeta } from '../../hooks/usePageMeta'
import PageHero from '../../components/public/PageHero'
import Button from '../../components/ui/Button'

const points = [
  ['Go online when you can work', 'The delivery desk shows offered jobs only while you are available.'],
  ['Accept or decline', 'You choose the trip. A declined job is not forced back onto you.'],
  ['Location for that order', 'While a delivery is active, your position is shared with the customer, the shop, and admins for that order.'],
  ['Earnings from the delivery fee', 'Partners earn 70% of the delivery fee, with a minimum of ₹25 on a completed trip.'],
]

export default function ForDeliveryPage() {
  usePageMeta('Deliver with NEARE', 'Accept nearby delivery jobs and complete them from the partner desk.')

  return (
    <div>
      <PageHero
        eyebrow="Delivery partners"
        title="Carry orders from the shop to the door."
        lede="Pickup orders stay at the counter. Delivery partners only handle trips the customer requested."
      >
        <Link to="/register?role=DELIVERY_PARTNER"><Button variant="brand">Become a partner</Button></Link>
        <Link to="/login"><Button variant="ghost">Partner sign in</Button></Link>
      </PageHero>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-16 md:grid-cols-2">
        {points.map(([title, body]) => (
          <article key={title} className="rounded-2xl border border-line bg-white p-6">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
