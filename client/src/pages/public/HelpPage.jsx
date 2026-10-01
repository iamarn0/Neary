import { Link } from 'react-router-dom'
import { usePageMeta } from '../../hooks/usePageMeta'
import PageHero from '../../components/public/PageHero'

const faqs = [
  ['Do I need an account to read the site?', 'No. The public pages are open. Searching shops, adding a cart, and placing an order require a customer account.'],
  ['Why can a cart hold only one shop?', 'Pickup and delivery are fulfilled by a single store. Mixing shops would split the trip and the bill.'],
  ['What does the delivery fee include?', '₹20 plus ₹8 for each kilometre. Pickup has no delivery fee.'],
  ['Are UPI and card payments real charges?', 'In this version they are recorded as paid and the receipt says nothing was charged. Cash is collected when the order is completed.'],
  ['Where is my pickup code?', 'The shop sees it only after the order is ready. You use that code at the counter.'],
  ['A shop is missing from the map.', 'Only approved shops inside the search radius appear. A new shop stays hidden until an admin approves it.'],
]

export default function HelpPage() {
  usePageMeta('Help · NEARE', 'Answers for customers, shop owners, and delivery partners.')

  return (
    <div>
      <PageHero
        eyebrow="Help"
        title="Questions the marketplace already answers."
        lede="If you are signed in, order status lives on your orders page. These answers cover how the service is set up."
      />
      <section className="mx-auto max-w-3xl px-4 py-16">
        <div className="divide-y divide-line rounded-2xl border border-line bg-white">
          {faqs.map(([question, answer]) => (
            <details key={question} className="group px-5 py-4">
              <summary className="cursor-pointer font-medium">{question}</summary>
              <p className="mt-2 text-sm leading-6 text-muted">{answer}</p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted">
          Still stuck? <Link className="text-ink underline" to="/contact">Contact NEARE</Link>
        </p>
      </section>
    </div>
  )
}
