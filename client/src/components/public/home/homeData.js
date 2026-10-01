const photo = (id, width = 1400) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`

export const images = {
  shop: photo('1578916171728-46686eac8d58'),
  bakery: photo('1517433670267-08bbd4be890f'),
  veg: photo('1540420773420-3366772f4999'),
  fruit: photo('1619566636858-adf3ef46400b'),
  pet: photo('1589924691995-400dc9ecc119'),
  household: photo('1563453392212-326f5e854473'),
  pharmacy: photo('1584308666744-24d5c474f2ae'),
  stationery: photo('1456735190827-d1262f71b8a3'),
  cake: photo('1555507036-ab1f4038808a'),
}

/** Demo customer pin from the seeded Salt Lake address. The public page never asks for GPS. */
export const YOU = [88.4092, 22.5814]

export const HERO_CENTER = [88.4126, 22.5874]

export const DELIVERY_ROUTE = [
  [88.4148, 22.5852],
  [88.4122, 22.5834],
  [88.4092, 22.5814],
]

export const RIDER = [88.4122, 22.5834]

function kmBetween(from, to) {
  const toRad = (value) => (value * Math.PI) / 180
  const dLat = toRad(to[1] - from[1])
  const dLng = toRad(to[0] - from[0])
  const lat1 = toRad(from[1])
  const lat2 = toRad(to[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function formatKm(km) {
  return `${km.toFixed(1)} km`
}

const shops = [
  {
    name: 'FreshMart',
    category: 'Grocery',
    area: 'Salt Lake',
    coordinates: [88.4148, 22.5852],
    cover: images.shop,
    prep: [15, 25],
    open: true,
    delivery: true,
    pickup: true,
    rating: 4.7,
    reviews: 1,
    marker: 'FreshMart',
    story: 'A Salt Lake counter for milk, rice, and the things that run out first.',
  },
  {
    name: 'Daily Basket',
    category: 'Grocery',
    area: 'Lake Town',
    coordinates: [88.4122, 22.5934],
    cover: images.shop,
    prep: [20, 30],
    open: true,
    delivery: true,
    pickup: true,
    rating: null,
    reviews: 0,
    marker: 'Basket',
    story: 'A compact Lake Town grocery that keeps pickup and delivery on the same shelf.',
  },
  {
    name: 'GreenLeaf Grocers',
    category: 'Fruits & Vegetables',
    area: 'New Town',
    coordinates: [88.4742, 22.5904],
    cover: images.veg,
    prep: [15, 25],
    open: true,
    delivery: true,
    pickup: true,
    rating: null,
    reviews: 0,
    marker: 'GreenLeaf',
    story: 'New Town produce packed the same morning it comes in.',
  },
  {
    name: 'Urban Pantry',
    category: 'Grocery',
    area: 'Park Street',
    coordinates: [88.3526, 22.5532],
    cover: images.fruit,
    prep: [20, 35],
    open: true,
    delivery: true,
    pickup: true,
    rating: null,
    reviews: 0,
    marker: 'Pantry',
    story: 'Snacks and staples for a Park Street run.',
  },
  {
    name: 'Bake House',
    category: 'Bakery',
    area: 'Ballygunge',
    coordinates: [88.3648, 22.5268],
    cover: images.bakery,
    prep: [20, 40],
    open: true,
    delivery: true,
    pickup: true,
    rating: null,
    reviews: 0,
    marker: 'Bake House',
    story: 'Morning loaves and evening cakes from a Ballygunge oven.',
  },
  {
    name: 'Pet Corner',
    category: 'Pet Supplies',
    area: 'Jadavpur',
    coordinates: [88.3718, 22.4972],
    cover: images.pet,
    prep: [15, 30],
    open: true,
    delivery: true,
    pickup: true,
    rating: null,
    reviews: 0,
    marker: 'Pets',
    story: 'Pet food and everyday care from a Jadavpur shop.',
  },
  {
    name: 'HomeNeeds',
    category: 'Household',
    area: 'Behala',
    coordinates: [88.3124, 22.5018],
    cover: images.household,
    prep: [25, 40],
    open: true,
    delivery: true,
    pickup: true,
    rating: null,
    reviews: 0,
    marker: 'Home',
    story: 'Cleaning supplies and household basics from Behala.',
  },
  {
    name: 'CareWell Pharmacy',
    category: 'Pharmacy',
    area: 'Dum Dum',
    coordinates: [88.4215, 22.6264],
    cover: images.pharmacy,
    prep: [10, 20],
    open: true,
    delivery: true,
    pickup: true,
    rating: null,
    reviews: 0,
    marker: 'CareWell',
    story: 'Everyday pharmacy shelf items from Dum Dum.',
  },
  {
    name: 'Night Owl Stores',
    category: 'Grocery',
    area: 'Tollygunge',
    coordinates: [88.3472, 22.4994],
    cover: images.shop,
    prep: [20, 30],
    open: false,
    delivery: true,
    pickup: true,
    rating: null,
    reviews: 0,
    marker: 'Night Owl',
    story: 'A Tollygunge grocery that closes when the day does.',
  },
  {
    name: 'Stitch & Co',
    category: 'Clothing',
    area: 'Salt Lake',
    coordinates: [88.4081, 22.5764],
    cover: images.cake,
    prep: [15, 25],
    open: true,
    delivery: true,
    pickup: true,
    rating: null,
    reviews: 0,
    marker: 'Stitch',
    story: 'Everyday tees and shirts from Sector V.',
  },
].map((shop) => ({ ...shop, km: kmBetween(YOU, shop.coordinates) }))

export const catalogue = shops

export const previewShops = ['FreshMart', 'Daily Basket', 'GreenLeaf Grocers', 'Bake House', 'CareWell Pharmacy', 'Night Owl Stores']
  .map((name) => shops.find((shop) => shop.name === name))

export const nearbyRadiusKm = 2

export const shopsWithinRadius = shops.filter((shop) => shop.km <= nearbyRadiusKm)

export const heroMarkers = [
  { key: 'fresh', coordinates: [88.4148, 22.5852], variant: 'dot', label: 'FreshMart', ariaLabel: 'FreshMart', color: '#111827' },
  { key: 'basket', coordinates: [88.4122, 22.5934], variant: 'dot', label: 'Daily Basket', ariaLabel: 'Daily Basket', color: '#111827' },
  { key: 'stitch', coordinates: [88.4081, 22.5764], variant: 'dot', label: 'Stitch & Co', ariaLabel: 'Stitch & Co', color: '#111827' },
  { key: 'you', coordinates: YOU, variant: 'you', label: 'You', ariaLabel: 'Demo customer in Salt Lake', zIndex: 3 },
]

export const coverageMarkers = [
  ...shops.map((shop) => ({
    coordinates: shop.coordinates,
    variant: 'place',
    label: shop.marker,
    ariaLabel: `${shop.name}, ${shop.area}`,
    color: shop.open ? '#111827' : '#6B7280',
  })),
  { coordinates: YOU, variant: 'you', label: 'You', ariaLabel: 'Demo customer in Salt Lake', zIndex: 3 },
]

export const suggestions = [
  { label: 'Milk', q: 'Milk' },
  { label: 'Fresh vegetables', q: 'Vegetables' },
  { label: 'Bakery', q: 'Bakery' },
  { label: 'Groceries', q: 'groceries' },
  { label: 'Pet supplies', q: 'Pet' },
]

export const stats = [
  { label: 'Local shops', value: 10, hint: 'Approved in the demo' },
  { label: 'Products', value: 31, hint: 'On those shelves' },
  { label: 'Neighborhoods', value: 6, hint: 'Named across Kolkata' },
  { label: 'Pickup & delivery', text: 'Available', hint: 'From the same counters' },
]

export const steps = [
  { n: '01', title: 'Choose your location', body: "Tell NEARE where you're shopping from." },
  { n: '02', title: 'Discover nearby', body: 'Find shops and products around you.' },
  { n: '03', title: 'Choose pickup or delivery', body: 'Get it delivered or collect it yourself.' },
  { n: '04', title: 'Track your order', body: 'Follow your order from shop to doorstep.' },
]

export const categories = [
  { name: 'Grocery', descriptor: 'Everyday essentials', count: 4, image: images.shop, span: 'lg:col-span-2 lg:row-span-2' },
  { name: 'Fruits & Vegetables', descriptor: 'Morning produce', count: 1, image: images.fruit, span: 'lg:col-span-2' },
  { name: 'Bakery', descriptor: 'Bread and bakes', count: 1, image: images.bakery },
  { name: 'Meat & Fish', descriptor: 'Fresh counters', count: 0, panel: true },
  { name: 'Household', descriptor: 'Home supplies', count: 1, image: images.household },
  { name: 'Pet Supplies', descriptor: 'Food and care', count: 1, image: images.pet },
  { name: 'Stationery', descriptor: 'Notes and pens', count: 0, image: images.stationery },
  { name: 'Pharmacy', descriptor: 'Everyday shelf care', count: 1, image: images.pharmacy },
]

export const localStories = [
  shops.find((shop) => shop.name === 'FreshMart'),
  shops.find((shop) => shop.name === 'Bake House'),
  shops.find((shop) => shop.name === 'GreenLeaf Grocers'),
]

export const sampleOrders = [
  { shop: 'FreshMart', status: 'New order', tone: 'brand', total: '₹482' },
  { shop: 'Bake House', status: 'Preparing', tone: 'info', total: '₹320' },
]

export const deliverySteps = ['Shop', 'Preparing', 'Ready', 'Out for delivery', 'You']

export const navItems = [
  { to: '/how-it-works', label: 'How it works' },
  { to: '/coverage', label: 'Coverage' },
  { to: '/for-shops', label: 'For shops' },
  { to: '/for-delivery', label: 'Deliver' },
]
