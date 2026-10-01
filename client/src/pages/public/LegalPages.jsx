import { usePageMeta } from '../../hooks/usePageMeta'
import PageHero from '../../components/public/PageHero'

function Article({ sections }) {
  return (
    <article className="mx-auto max-w-3xl space-y-8 px-4 py-16">
      {sections.map(([title, body]) => (
        <section key={title}>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
        </section>
      ))}
    </article>
  )
}

export function PrivacyPage() {
  usePageMeta('Privacy · NEARE')
  return (
    <div>
      <PageHero eyebrow="Privacy" title="What NEARE stores about you." lede="Accounts, addresses, orders, and delivery locations exist so a neighbourhood order can be fulfilled." />
      <Article sections={[
        ['Account', 'Name, email, phone, and a hashed password identify the account. The role decides which desk you open after sign-in.'],
        ['Location', 'The neighbourhood you choose is kept in the browser so nearby search can run. A delivery partner’s live position is stored only for the active trip and shown to the customer, the shop on that order, and admins.'],
        ['Orders', 'An order keeps the shop, items, address, totals, status history, and payment record. Pickup codes are hidden from the shop list until the order is ready.'],
        ['Payments', 'UPI and card checkouts in this version do not charge a bank or wallet. The receipt records a simulated payment.'],
      ]} />
    </div>
  )
}

export function TermsPage() {
  usePageMeta('Terms · NEARE')
  return (
    <div>
      <PageHero eyebrow="Terms" title="How the marketplace is allowed to be used." lede="NEARE is a hyperlocal service for Kolkata. These terms match the product you can use today." />
      <Article sections={[
        ['Accounts', 'Customers, shop owners, and delivery partners register for their own role. Admin accounts are issued by NEARE and cannot be created from the public form.'],
        ['Orders', 'A cart contains products from one shop. Stock is reserved when the order is placed and restored if the order is cancelled or rejected while that is still allowed.'],
        ['Shops', 'A shop is visible to customers after approval. Owners set hours, radius, and whether pickup or delivery is offered.'],
        ['Payments and fees', 'Delivery is ₹20 plus ₹8 per kilometre. Pickup has no delivery fee. Simulated UPI and card payments are not a charge. Cash is due on completion.'],
      ]} />
    </div>
  )
}
