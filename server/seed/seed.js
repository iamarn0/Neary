import 'dotenv/config'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { connectDb } from '../config/db.js'
import User from '../models/User.js'
import Category from '../models/Category.js'
import Shop from '../models/Shop.js'
import Product from '../models/Product.js'
import Address from '../models/Address.js'
import Order from '../models/Order.js'
import Delivery from '../models/Delivery.js'
import Review from '../models/Review.js'
import Cart from '../models/Cart.js'
import Notification from '../models/Notification.js'
import Counter from '../models/Counter.js'

const img = {
  milk: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80',
  bread: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  eggs: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=800&q=80',
  rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
  dal: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=800&q=80',
  veg: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  fruit: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=800&q=80',
  snacks: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=800&q=80',
  drink: 'https://images.unsplash.com/photo-1629203851122-3726ec1f3c43?auto=format&fit=crop&w=800&q=80',
  clean: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=800&q=80',
  notes: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=800&q=80',
  pet: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=800&q=80',
  cake: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
  pharmacy: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
  tee: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
  shirt: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
  jeans: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80',
  shop: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1400&q=80',
  bakery: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=1400&q=80',
}

async function main() {
  await connectDb()
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Shop.deleteMany({}),
    Product.deleteMany({}),
    Address.deleteMany({}),
    Order.deleteMany({}),
    Delivery.deleteMany({}),
    Review.deleteMany({}),
    Cart.deleteMany({}),
    Notification.deleteMany({}),
    Counter.deleteMany({}),
  ])

  const [customerPass, shopPass, deliveryPass, adminPass] = await Promise.all([
    bcrypt.hash('Customer@123', 10),
    bcrypt.hash('Shop@123', 10),
    bcrypt.hash('Delivery@123', 10),
    bcrypt.hash('Admin@123', 10),
  ])

  const customer = await User.create({
    name: 'Aisha Rahman',
    email: 'customer@neare.local',
    phone: '9000000001',
    password: customerPass,
    role: 'CUSTOMER',
  })
  const owner = await User.create({
    name: 'Rahul Sen',
    email: 'shop@neare.local',
    phone: '9000000002',
    password: shopPass,
    role: 'SHOP_OWNER',
  })
  const partner = await User.create({
    name: 'Imran Ali',
    email: 'delivery@neare.local',
    phone: '9000000003',
    password: deliveryPass,
    role: 'DELIVERY_PARTNER',
    isOnline: true,
    partnerProfile: {
      city: 'Kolkata',
      area: 'Salt Lake',
      baseLocation: { type: 'Point', coordinates: [88.4092, 22.5814] },
      partnerStatus: 'APPROVED',
      payoutLabel: 'Demo payout profile',
      statusNote: '',
    },
  })
  await User.create({
    name: 'NEARE Admin',
    email: 'admin@neare.local',
    phone: '9000000004',
    password: adminPass,
    role: 'ADMIN',
  })
  const pendingOwner = await User.create({
    name: 'Meera Das',
    email: 'pending@neare.local',
    phone: '9000000005',
    password: shopPass,
    role: 'SHOP_OWNER',
  })
  await User.create({
    name: 'Nabila Ghosh',
    email: 'pending-delivery@neare.local',
    phone: '9000000006',
    password: deliveryPass,
    role: 'DELIVERY_PARTNER',
    partnerProfile: {
      city: 'Kolkata',
      area: 'New Town',
      baseLocation: { type: 'Point', coordinates: [88.481, 22.5892] },
      partnerStatus: 'PENDING',
      payoutLabel: 'Demo payout profile',
      statusNote: '',
    },
  })

  const categoryNames = [
    ['Grocery', 'Everyday staples from neighbourhood shops'],
    ['Fruits & Vegetables', 'Fresh produce from local sellers'],
    ['Bakery', 'Bread, cakes, and baked snacks'],
    ['Meat & Fish', 'Fresh cuts from trusted counters'],
    ['Household', 'Cleaning and home supplies'],
    ['Stationery', 'Notebooks, pens, and school supplies'],
    ['Pet Supplies', 'Food and care for pets'],
    ['Pharmacy', 'Everyday pharmacy shelf items'],
    ['Clothing', 'Everyday shirts, tees, and denim from neighbourhood stores'],
  ]
  const categories = {}
  for (const [name, description] of categoryNames) {
    const slug = name.toLowerCase().replace(/&/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    categories[name] = await Category.create({ name, slug, description })
  }

  const extraOwners = []
  for (let index = 0; index < 7; index += 1) {
    extraOwners.push(await User.create({
      name: `Shop Owner ${index + 1}`,
      email: `owner${index + 1}@neare.local`,
      phone: `900000001${index}`,
      password: shopPass,
      role: 'SHOP_OWNER',
    }))
  }

  const shopSeeds = [
    {
      name: 'FreshMart',
      owner: owner._id,
      category: 'Grocery',
      description: 'A Salt Lake neighbourhood store for milk, staples, and daily groceries.',
      address: 'Block BD, Sector I, Salt Lake',
      city: 'Kolkata',
      pinCode: '700064',
      coordinates: [88.4148, 22.5852],
      phone: '9000000101',
      email: 'freshmart@neare.local',
      gstin: '19AAAAA0000A1Z5',
      cover: img.shop,
      prep: [15, 25],
    },
    {
      name: 'Daily Basket',
      owner: extraOwners[0]._id,
      category: 'Grocery',
      description: 'Compact grocery shop with pickup and delivery toward Lake Town.',
      address: 'Lake Town Block B',
      city: 'Kolkata',
      pinCode: '700089',
      coordinates: [88.4122, 22.5934],
      phone: '9000000102',
      email: 'daily@neare.local',
      cover: img.shop,
      prep: [20, 30],
    },
    {
      name: 'GreenLeaf Grocers',
      owner: extraOwners[1]._id,
      category: 'Fruits & Vegetables',
      description: 'Morning produce from New Town, packed for the day.',
      address: 'Action Area I, New Town',
      city: 'Kolkata',
      pinCode: '700156',
      coordinates: [88.4742, 22.5904],
      phone: '9000000103',
      email: 'greenleaf@neare.local',
      cover: img.veg,
      prep: [15, 25],
      delivery: true,
      pickup: true,
    },
    {
      name: 'Urban Pantry',
      owner: extraOwners[2]._id,
      category: 'Grocery',
      description: 'Park Street pantry for snacks, drinks, and staples.',
      address: 'Near Park Street',
      city: 'Kolkata',
      pinCode: '700016',
      coordinates: [88.3526, 22.5532],
      phone: '9000000104',
      email: 'urban@neare.local',
      cover: img.shop,
      prep: [20, 35],
    },
    {
      name: 'Bake House',
      owner: extraOwners[3]._id,
      category: 'Bakery',
      description: 'Ballygunge bakery for bread, cakes, and evening bakes.',
      address: 'Gariahat Road, Ballygunge',
      city: 'Kolkata',
      pinCode: '700019',
      coordinates: [88.3648, 22.5268],
      phone: '9000000105',
      email: 'bake@neare.local',
      cover: img.bakery,
      prep: [20, 40],
      delivery: true,
      pickup: true,
    },
    {
      name: 'Pet Corner',
      owner: extraOwners[4]._id,
      category: 'Pet Supplies',
      description: 'Jadavpur shop for pet food and everyday pet care.',
      address: 'Jadavpur Central Road',
      city: 'Kolkata',
      pinCode: '700032',
      coordinates: [88.3718, 22.4972],
      phone: '9000000106',
      email: 'pet@neare.local',
      cover: img.pet,
      prep: [15, 30],
    },
    {
      name: 'HomeNeeds',
      owner: extraOwners[5]._id,
      category: 'Household',
      description: 'Behala store for cleaning supplies and household basics.',
      address: 'Behala Chowrasta',
      city: 'Kolkata',
      pinCode: '700034',
      coordinates: [88.3124, 22.5018],
      phone: '9000000107',
      email: 'home@neare.local',
      cover: img.clean,
      prep: [25, 40],
    },
    {
      name: 'CareWell Pharmacy',
      owner: extraOwners[6]._id,
      category: 'Pharmacy',
      description: 'Dum Dum pharmacy counter for everyday shelf items.',
      address: 'Dum Dum Road',
      city: 'Kolkata',
      pinCode: '700028',
      coordinates: [88.4215, 22.6264],
      phone: '9000000108',
      email: 'carewell@neare.local',
      cover: img.pharmacy,
      prep: [10, 20],
    },
    {
      name: 'Night Owl Stores',
      owner: extraOwners[0]._id,
      skip: true,
    },
  ]

  // Night Owl needs its own owner because owner is unique.
  const clothOwner = await User.create({
    name: 'Stitch Owner',
    email: 'stitch@neare.local',
    phone: '9000000111',
    password: shopPass,
    role: 'SHOP_OWNER',
  })

  const nightOwner = await User.create({
    name: 'Night Owl Owner',
    email: 'nightowl@neare.local',
    phone: '9000000099',
    password: shopPass,
    role: 'SHOP_OWNER',
  })

  const shops = {}
  const approvedSeeds = [
    shopSeeds[0],
    shopSeeds[1],
    shopSeeds[2],
    shopSeeds[3],
    shopSeeds[4],
    shopSeeds[5],
    shopSeeds[6],
    shopSeeds[7],
    {
      name: 'Night Owl Stores',
      owner: nightOwner._id,
      category: 'Grocery',
      description: 'Tollygunge store currently closed for the day.',
      address: 'Tollygunge Circular Road',
      city: 'Kolkata',
      pinCode: '700033',
      coordinates: [88.3472, 22.4994],
      phone: '9000000109',
      email: 'nightowl@neare.local',
      cover: img.shop,
      prep: [20, 30],
      closed: true,
    },
    {
      name: 'Stitch & Co',
      owner: clothOwner._id,
      category: 'Clothing',
      description: 'Salt Lake shop for everyday tees, shirts, and denim.',
      address: 'Sector V, Salt Lake',
      city: 'Kolkata',
      pinCode: '700091',
      coordinates: [88.4081, 22.5764],
      phone: '9000000112',
      email: 'stitchshop@neare.local',
      cover: img.tee,
      prep: [15, 25],
    },
  ]

  for (const seed of approvedSeeds) {
    shops[seed.name] = await Shop.create({
      name: seed.name,
      description: seed.description,
      logo: seed.cover,
      coverImage: seed.cover,
      owner: seed.owner,
      category: categories[seed.category]._id,
      categories: [categories[seed.category]._id],
      phone: seed.phone,
      email: seed.email,
      gstin: seed.gstin || '',
      address: seed.address,
      city: seed.city,
      state: 'West Bengal',
      pinCode: seed.pinCode,
      location: { type: 'Point', coordinates: seed.coordinates },
      openingTime: '00:00',
      closingTime: '23:59',
      isManuallyClosed: Boolean(seed.closed),
      approvalStatus: 'APPROVED',
      deliveryAvailable: true,
      pickupAvailable: true,
      deliveryRadius: 8,
      prepTimeMin: seed.prep[0],
      prepTimeMax: seed.prep[1],
      rating: 0,
      reviewCount: 0,
    })
  }

  await Shop.create({
    name: 'Paper & Co',
    description: 'Alipore stationery shop waiting for approval.',
    owner: pendingOwner._id,
    category: categories.Stationery._id,
    categories: [categories.Stationery._id],
    phone: '9000000110',
    email: 'paper@neare.local',
    address: 'Alipore Road',
    city: 'Kolkata',
    state: 'West Bengal',
    pinCode: '700027',
    location: { type: 'Point', coordinates: [88.3324, 22.5262] },
    openingTime: '10:00',
    closingTime: '20:00',
    approvalStatus: 'PENDING_APPROVAL',
    deliveryAvailable: true,
    pickupAvailable: true,
    coverImage: img.notes,
    logo: img.notes,
  })

  const catalog = {
    FreshMart: [
      ['Amul Taaza Milk', 'Toned milk for daily use.', 'Grocery', 68, 64, '1 litre', 24, img.milk],
      ['Brown Bread', 'Soft sandwich loaf.', 'Bakery', 45, 40, '400 g', 4, img.bread],
      ['Farm Eggs', 'Pack of six.', 'Grocery', 90, null, '6 pcs', 0, img.eggs],
      ['Basmati Rice', 'Everyday basmati.', 'Grocery', 180, null, '1 kg', 16, img.rice],
      ['Toor Dal', 'Unpolished toor dal.', 'Grocery', 146, 140, '1 kg', 12, img.dal],
      ['Salted Chips', 'Lightly salted potato chips.', 'Grocery', 20, null, 'pack', 30, img.snacks],
    ],
    'Daily Basket': [
      ['Amul Taaza Milk', 'Toned milk.', 'Grocery', 66, null, '1 litre', 18, img.milk],
      ['White Bread', 'Daily loaf.', 'Bakery', 35, null, '400 g', 10, img.bread],
      ['Cold Drink', 'Orange flavoured drink.', 'Grocery', 40, null, '750 ml', 14, img.drink],
      ['Poha', 'Flattened rice.', 'Grocery', 55, null, '500 g', 9, img.rice],
    ],
    'GreenLeaf Grocers': [
      ['Tomato', 'Ripe local tomatoes.', 'Fruits & Vegetables', 32, null, '500 g', 20, img.veg],
      ['Banana', 'Robusta bananas.', 'Fruits & Vegetables', 48, null, '6 pcs', 15, img.fruit],
      ['Spinach', 'Washed spinach bunch.', 'Fruits & Vegetables', 25, null, 'bunch', 8, img.veg],
      ['Apple', 'Kashmir apples.', 'Fruits & Vegetables', 180, 165, '1 kg', 11, img.fruit],
    ],
    'Urban Pantry': [
      ['Salted Chips', 'Party pack.', 'Grocery', 55, null, 'pack', 22, img.snacks],
      ['Cold Drink', 'Cola bottle.', 'Grocery', 40, null, '750 ml', 19, img.drink],
      ['Basmati Rice', 'Long grain.', 'Grocery', 190, null, '1 kg', 7, img.rice],
    ],
    'Bake House': [
      ['Sourdough Loaf', 'Baked this morning.', 'Bakery', 120, null, 'loaf', 6, img.bread],
      ['Butter Cake', 'Plain butter slice cake.', 'Bakery', 280, 250, '500 g', 5, img.cake],
      ['Cookies', 'Butter cookies tin.', 'Bakery', 160, null, '200 g', 9, img.snacks],
    ],
    'Pet Corner': [
      ['Dog Food', 'Adult dry food.', 'Pet Supplies', 340, null, '1 kg', 10, img.pet],
      ['Cat Food', 'Wet food pouch.', 'Pet Supplies', 45, null, 'pouch', 16, img.pet],
    ],
    HomeNeeds: [
      ['Dishwash Liquid', 'Lemon dishwash.', 'Household', 95, null, '750 ml', 13, img.clean],
      ['Floor Cleaner', 'Citrus floor cleaner.', 'Household', 120, 110, '1 litre', 8, img.clean],
    ],
    'CareWell Pharmacy': [
      ['Cotton Roll', 'Absorbent cotton.', 'Pharmacy', 40, null, 'pack', 20, img.pharmacy],
      ['Antiseptic Liquid', 'Household antiseptic.', 'Pharmacy', 85, null, '100 ml', 14, img.pharmacy],
      ['ORS Sachet', 'Oral rehydration sachet.', 'Pharmacy', 22, null, 'sachet', 30, img.pharmacy],
    ],
    'Night Owl Stores': [
      ['White Bread', 'Loaf.', 'Bakery', 38, null, '400 g', 3, img.bread],
    ],
    'Stitch & Co': [
      ['Cotton T-shirt', 'Everyday cotton tee.', 'Clothing', 499, 449, 'piece', 12, img.tee],
      ['Linen Shirt', 'Half-sleeve linen shirt.', 'Clothing', 899, null, 'piece', 8, img.shirt],
      ['Everyday Jeans', 'Straight-fit denim.', 'Clothing', 1299, 1199, 'piece', 6, img.jeans],
    ],
  }

  const products = {}
  let barcodeSeq = 890100000001
  for (const [shopName, rows] of Object.entries(catalog)) {
    for (const [name, description, category, price, salePrice, unit, stock, image] of rows) {
      const product = await Product.create({
        shop: shops[shopName]._id,
        name,
        description,
        category: categories[category]._id,
        images: [image],
        price,
        salePrice,
        unit,
        barcode: String(barcodeSeq++),
        stock,
        lowStockThreshold: 5,
        isAvailable: stock > 0,
      })
      products[`${shopName}:${name}`] = product
    }
  }

  const address = await Address.create({
    customer: customer._id,
    fullName: 'Aisha Rahman',
    phone: '9000000001',
    flat: '12B',
    building: 'Greenview Apartments',
    area: 'Salt Lake',
    city: 'Kolkata',
    state: 'West Bengal',
    pinCode: '700064',
    landmark: 'Near City Centre',
    location: { type: 'Point', coordinates: [88.4092, 22.5814] },
    isDefault: true,
  })

  customer.favoriteShops = [shops.FreshMart._id, shops['Daily Basket']._id]
  await customer.save()

  const milk = products['FreshMart:Amul Taaza Milk']
  const bread = products['FreshMart:Brown Bread']
  const rice = products['FreshMart:Basmati Rice']
  const daysAgo = (days, hours = 10) => {
    const date = new Date()
    date.setDate(date.getDate() - days)
    date.setHours(hours, 15, 0, 0)
    return date
  }

  const delivered = await Order.create({
    orderNumber: 'NE-1041',
    customer: customer._id,
    shop: shops.FreshMart._id,
    items: [
      { product: rice._id, name: rice.name, price: 180, quantity: 1, unit: rice.unit, image: rice.images[0] },
      { product: milk._id, name: milk.name, price: 64, quantity: 2, unit: milk.unit, image: milk.images[0] },
    ],
    subtotal: 308,
    deliveryFee: 28,
    tax: 0,
    discount: 0,
    total: 336,
    fulfillmentMethod: 'DELIVERY',
    shippingAddress: address.toObject(),
    paymentMethod: 'UPI',
    paymentStatus: 'PAID',
    paymentProvider: 'mock',
    paymentReference: 'mock_NE-1041',
    paymentNote: 'Simulated payment. No money was sent to a real provider.',
    orderStatus: 'DELIVERED',
    distanceKm: 0.8,
    etaMin: 25,
    etaMax: 35,
    statusHistory: [
      { status: 'PLACED', at: daysAgo(3, 9) },
      { status: 'ACCEPTED', at: daysAgo(3, 9) },
      { status: 'PREPARING', at: daysAgo(3, 9) },
      { status: 'READY', at: daysAgo(3, 10) },
      { status: 'OUT_FOR_DELIVERY', at: daysAgo(3, 10) },
      { status: 'DELIVERED', at: daysAgo(3, 11) },
    ],
    createdAt: daysAgo(3, 9),
    updatedAt: daysAgo(3, 11),
  })

  await Review.create({
    customer: customer._id,
    shop: shops.FreshMart._id,
    order: delivered._id,
    rating: 5,
    comment: 'Milk and rice arrived quickly, packed properly.',
    createdAt: daysAgo(3, 12),
  })
  shops.FreshMart.rating = 4.7
  shops.FreshMart.reviewCount = 1
  await shops.FreshMart.save()

  const activeOrder = await Order.create({
    orderNumber: 'NE-1042',
    customer: customer._id,
    shop: shops.FreshMart._id,
    items: [
      { product: milk._id, name: milk.name, price: 64, quantity: 2, unit: milk.unit, image: milk.images[0] },
      { product: bread._id, name: bread.name, price: 40, quantity: 1, unit: bread.unit, image: bread.images[0] },
      { product: rice._id, name: rice.name, price: 180, quantity: 2, unit: rice.unit, image: rice.images[0] },
    ],
    subtotal: 528,
    deliveryFee: 26,
    tax: 0,
    discount: 0,
    total: 554,
    fulfillmentMethod: 'DELIVERY',
    shippingAddress: address.toObject(),
    paymentMethod: 'COD',
    paymentStatus: 'PENDING',
    paymentProvider: 'mock',
    paymentNote: 'Cash on delivery. This is a simulated checkout — nothing was charged.',
    orderStatus: 'OUT_FOR_DELIVERY',
    distanceKm: 0.8,
    etaMin: 20,
    etaMax: 30,
    statusHistory: [
      { status: 'PLACED', at: daysAgo(0, 8) },
      { status: 'ACCEPTED', at: daysAgo(0, 8) },
      { status: 'PREPARING', at: daysAgo(0, 8) },
      { status: 'READY', at: daysAgo(0, 9) },
      { status: 'OUT_FOR_DELIVERY', at: daysAgo(0, 9) },
    ],
    createdAt: daysAgo(0, 8),
  })

  const delivery = await Delivery.create({
    order: activeOrder._id,
    deliveryPartner: partner._id,
    status: 'PICKED_UP',
    pickupLocation: shops.FreshMart.location,
    dropoffLocation: address.location,
    currentLocation: { type: 'Point', coordinates: [88.4122, 22.5834] },
    locationUpdatedAt: new Date(),
    acceptedAt: daysAgo(0, 9),
    pickedUpAt: daysAgo(0, 9),
    estimatedDeliveryTime: 30,
    demoProgress: 0.25,
  })
  activeOrder.delivery = delivery._id
  await activeOrder.save()

  await Order.create({
    orderNumber: 'NE-1043',
    customer: customer._id,
    shop: shops.FreshMart._id,
    items: [
      { product: milk._id, name: milk.name, price: 64, quantity: 1, unit: milk.unit, image: milk.images[0] },
    ],
    subtotal: 64,
    deliveryFee: 0,
    tax: 0,
    discount: 0,
    total: 64,
    fulfillmentMethod: 'PICKUP',
    shippingAddress: {
      fullName: customer.name,
      phone: customer.phone,
      flat: shops.FreshMart.address,
      area: 'Salt Lake',
      city: 'Kolkata',
      state: 'West Bengal',
      pinCode: '700064',
      landmark: 'Pickup at the shop',
      location: shops.FreshMart.location,
    },
    paymentMethod: 'UPI',
    paymentStatus: 'PAID',
    paymentProvider: 'mock',
    paymentReference: 'mock_NE-1043',
    paymentNote: 'Simulated payment. No money was sent to a real provider.',
    orderStatus: 'PLACED',
    pickupCode: '4821',
    distanceKm: 0,
    etaMin: 15,
    etaMax: 25,
    statusHistory: [{ status: 'PLACED', note: 'Order placed' }],
  })

  await Order.create({
    orderNumber: 'NE-1038',
    customer: customer._id,
    shop: shops['Bake House']._id,
    items: [
      { product: products['Bake House:Butter Cake']._id, name: 'Butter Cake', price: 250, quantity: 1, unit: '500 g', image: img.cake },
    ],
    subtotal: 250,
    deliveryFee: 42,
    tax: 0,
    total: 292,
    fulfillmentMethod: 'DELIVERY',
    shippingAddress: address.toObject(),
    paymentMethod: 'CARD',
    paymentStatus: 'PAID',
    paymentProvider: 'mock',
    paymentReference: 'mock_NE-1038',
    paymentNote: 'Simulated payment. No money was sent to a real provider.',
    orderStatus: 'DELIVERED',
    distanceKm: 6.2,
    etaMin: 35,
    etaMax: 50,
    statusHistory: [{ status: 'DELIVERED', at: daysAgo(1, 16) }],
    createdAt: daysAgo(1, 15),
  })

  await Counter.create({ name: 'order', seq: 1044 })

  await Notification.create({
    recipient: owner._id,
    type: 'NEW_ORDER',
    title: 'New order',
    message: 'NE-1043 is waiting for acceptance.',
    order: (await Order.findOne({ orderNumber: 'NE-1043' }))._id,
  })

  console.log('Seed complete')
  await mongoose.disconnect()
  process.exit(0)
}

main().catch(async (error) => {
  console.error(error)
  await mongoose.disconnect()
  process.exit(1)
})
