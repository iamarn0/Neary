import { Link } from 'react-router-dom'
import { usePageMeta } from '../../hooks/usePageMeta'
import PageHero from '../../components/public/PageHero'

const desks = [
  ['Customers', 'Sign in to search shops, track an order, or update an address.', '/login', 'Sign in'],
  ['Shop owners', 'Register the store, then use the shop desk after approval.', '/for-shops', 'For shops'],
  ['Delivery partners', 'Create a partner account and open the delivery desk.', '/for-delivery', 'Deliver with NEARE'],
]

export default function ContactPage() {
  usePageMeta('Contact · NEARE', 'Reach NEARE for customer, shop, and delivery questions.')

  return (
    <div>
      <PageHero
        eyebrow="Contact"
        title="Write to the desk that matches your role."
        lede="NEARE support for this city is support@neare.local. Include the order number if you already have one."
      />
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-16 md:grid-cols-3">
        {desks.map(([title, body, to, label]) => (
          <article key={title} className="rounded-2xl border border-line bg-white p-6">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
            <Link to={to} className="mt-4 inline-block text-sm font-medium text-info">{label}</Link>
          </article>
        ))}
      </section>
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 text-sm text-muted">
          <p className="font-medium text-ink">Kolkata</p>
          <p className="mt-2">Service area: neighbourhood shops across the city.</p>
          <p className="mt-1">Email: support@neare.local</p>
        </div>
      </section>
    </div>
  )
}
