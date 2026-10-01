import { Link } from 'react-router-dom'
import { frame, useHomeLinks } from './homeUi'

export default function PublicFooter() {
  const { explore, orders, shopDesk, deliveryDesk } = useHomeLinks()
  const columns = [
    {
      title: 'Explore',
      links: [
        { label: 'Shops', ...explore },
        { label: 'Categories', to: '/categories' },
        { label: 'Nearby', ...explore },
        { label: 'Orders', ...orders },
      ],
    },
    {
      title: 'For businesses',
      links: [
        { label: 'Become a shop partner', to: '/for-shops' },
        { label: 'Business dashboard', ...shopDesk },
        { label: 'Delivery partners', ...deliveryDesk },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', to: '/about' },
        { label: 'How it works', to: '/how-it-works' },
        { label: 'Coverage', to: '/coverage' },
        { label: 'Contact', to: '/contact' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy', to: '/privacy' },
        { label: 'Terms', to: '/terms' },
      ],
    },
  ]

  return (
    <footer className="border-t border-line bg-white">
      <div className={`${frame} grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5`}>
        <div className="lg:col-span-1">
          <p className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="h-2.5 w-2.5 bg-brand" aria-hidden="true" />
            NEARE
          </p>
          <p className="mt-3 max-w-[16rem] text-sm leading-6 text-muted">Everything you need, near you.</p>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <p className="text-sm font-medium">{column.title}</p>
            <ul className="mt-3 space-y-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} state={link.state} className="text-sm text-muted transition-colors hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className={`${frame} flex flex-col gap-1 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between`}>
          <p>© 2026 NEARE</p>
          <p>Built for local commerce.</p>
        </div>
      </div>
    </footer>
  )
}
