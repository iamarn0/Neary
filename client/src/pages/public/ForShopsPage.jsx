import { Link } from 'react-router-dom'
import { usePageMeta } from '../../hooks/usePageMeta'
import PageHero from '../../components/public/PageHero'
import Button from '../../components/ui/Button'

const points = [
  ['Your own desk', 'Orders, products, inventory, analytics, and shop settings live under one shop account.'],
  ['Approval before you go live', 'A new shop stays pending until an admin approves it. Customers only see approved shops.'],
  ['Hours and radius', 'Set opening hours, a delivery radius, and whether you are accepting pickup, delivery, or both.'],
  ['One order, one store', 'Customers cannot mix your products with another shop’s cart, so fulfilment stays inside your counter.'],
]

export default function ForShopsPage() {
  usePageMeta('For shops · NEARE', 'List a neighbourhood shop and receive pickup and delivery orders.')

  return (
    <div>
      <PageHero
        eyebrow="Shop partners"
        title="Bring the shop you already run onto the map."
        lede="NEARE is built for independent stores, not a warehouse. You keep the catalogue, the stock, and the decision to accept an order."
      >
        <Link to="/register?role=SHOP_OWNER"><Button variant="brand">Register your shop</Button></Link>
        <Link to="/login"><Button variant="ghost">Shop owner sign in</Button></Link>
      </PageHero>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-16 md:grid-cols-2">
        {points.map(([title, body]) => (
          <article key={title} className="rounded-2xl border border-line bg-white p-6">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
          </article>
        ))}
      </section>
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold">What you do after approval</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {['Add products and stock', 'Accept or reject a new order', 'Mark it ready, then hand it over'].map((item, index) => (
              <li key={item} className="rounded-2xl border border-line p-5 text-sm">
                <span className="text-muted">0{index + 1}</span>
                <p className="mt-2 font-medium">{item}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  )
}
