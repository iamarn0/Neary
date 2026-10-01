import { Link } from 'react-router-dom'
import { usePageMeta } from '../../hooks/usePageMeta'
import PageHero from '../../components/public/PageHero'
import Button from '../../components/ui/Button'

const steps = [
  ['Choose a neighbourhood', 'NEARE ranks approved shops by distance from the place you set. Salt Lake is the closest demo area to FreshMart.'],
  ['Search one shop at a time', 'A cart belongs to a single store. Adding an item from another shop asks you to clear the current cart first.'],
  ['Pick up or request delivery', 'Pickup ends at the counter with a code. Delivery assigns a partner, then you can follow the trip.'],
  ['Pay in rupees', 'UPI and card are marked paid in this version without charging a real account. Cash stays due until the order is completed.'],
]

export default function HowItWorksPage() {
  usePageMeta('How NEARE works', 'From neighbourhood to pickup or delivery, one shop at a time.')

  return (
    <div>
      <PageHero
        eyebrow="Customers"
        title="How NEARE works"
        lede="The public site explains the service. The signed-in marketplace is where you search, cart, and place the order."
      >
        <Link to="/login" state={{ from: '/home' }}><Button variant="brand">Explore nearby</Button></Link>
        <Link to="/coverage"><Button variant="ghost">See coverage</Button></Link>
      </PageHero>
      <ol className="mx-auto grid max-w-6xl gap-4 px-4 py-16 md:grid-cols-2">
        {steps.map(([title, body], index) => (
          <li key={title} className="rounded-2xl border border-line bg-white p-6">
            <p className="text-sm text-muted">0{index + 1}</p>
            <h2 className="mt-2 text-xl font-semibold">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted">{body}</p>
          </li>
        ))}
      </ol>
      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">Pickup</h2>
            <p className="mt-3 text-sm leading-6 text-muted">The shop prepares the order and marks it ready. You receive a pickup code and show it at the counter. The shop types that code to complete the order. No delivery partner is involved, and the delivery fee is zero.</p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Delivery</h2>
            <p className="mt-3 text-sm leading-6 text-muted">The fee starts at ₹20 and adds ₹8 per kilometre. A partner accepts the job, collects it from the shop, and shares location until it is delivered. You can open the tracking page for that order.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
