import { Link } from 'react-router-dom'
import { usePageMeta } from '../../hooks/usePageMeta'
import PageHero from '../../components/public/PageHero'
import Button from '../../components/ui/Button'

export default function AboutPage() {
  usePageMeta('About NEARE', 'NEARE is an India-first hyperlocal marketplace for neighbourhood shops.')

  return (
    <div>
      <PageHero
        eyebrow="About"
        title="Neighbourhood commerce, kept close."
        lede="NEARE connects customers with shops that are already on the street. The first city is Kolkata. Orders stay with one shop, in rupees, for pickup or a short delivery."
      />
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-3">
        {[
          ['Customers', 'Find what is open nearby, keep a cart with one store, and follow the order.'],
          ['Shops', 'Publish a catalogue and fulfil from the counter you already have.'],
          ['Partners', 'Move delivery orders across a short city distance and get paid from the delivery fee.'],
        ].map(([title, body]) => (
          <article key={title}>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
          </article>
        ))}
      </section>
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold">Four desks, one city</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            The public website is open to everyone. After sign-in, a customer opens the marketplace, a shop owner opens the shop desk, a delivery partner opens the delivery desk, and an admin opens the city desk.
          </p>
          <div className="mt-6">
            <Link to="/contact"><Button variant="ghost">Contact NEARE</Button></Link>
          </div>
        </div>
      </section>
    </div>
  )
}
