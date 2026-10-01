export const siteNav = [
  { to: '/how-it-works', label: 'How it works' },
  { to: '/coverage', label: 'Coverage' },
  { to: '/categories', label: 'Categories' },
  { to: '/for-shops', label: 'For shops' },
  { to: '/for-delivery', label: 'Deliver' },
]

export const footerGroups = [
  {
    title: 'Product',
    links: [
      { to: '/how-it-works', label: 'How it works' },
      { to: '/coverage', label: 'Kolkata coverage' },
      { to: '/categories', label: 'Categories' },
      { to: '/about', label: 'About NEARE' },
    ],
  },
  {
    title: 'Customers',
    links: [
      { to: '/login', label: 'Explore nearby', state: { from: '/home' } },
      { to: '/register', label: 'Create an account' },
      { to: '/help', label: 'Help' },
    ],
  },
  {
    title: 'Partners',
    links: [
      { to: '/for-shops', label: 'For shop owners' },
      { to: '/for-delivery', label: 'For delivery partners' },
      { to: '/register?role=SHOP_OWNER', label: 'Register a shop' },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: '/contact', label: 'Contact' },
      { to: '/privacy', label: 'Privacy' },
      { to: '/terms', label: 'Terms' },
    ],
  },
]
