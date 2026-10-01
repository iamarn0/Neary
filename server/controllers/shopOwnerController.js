import Shop from '../models/Shop.js'
import Product from '../models/Product.js'
import Category from '../models/Category.js'
import Order from '../models/Order.js'
import Counter from '../models/Counter.js'
import { ApiError, asyncHandler, send } from '../utils/http.js'
import { point } from '../utils/geo.js'
import { withOpenFlag } from '../utils/hours.js'
import { transitionOrder } from '../services/orderService.js'
import { assignDelivery } from '../services/deliveryService.js'
import InventoryMovement from '../models/InventoryMovement.js'
import { adjustStock, recordMovement, reserveStock, restoreStock } from '../services/inventoryService.js'
import { quoteTotals, round2, unitPrice } from '../utils/money.js'
import { pageMeta, pageParams } from '../utils/pagination.js'

async function ownedShop(userId) {
  const shop = await Shop.findOne({ owner: userId }).populate('category', 'name slug').populate('categories', 'name slug')
  if (!shop) throw new ApiError(404, 'Register your shop to continue.')
  return shop
}

function shopBody(body, file) {
  const doc = {
    name: body.name?.trim(),
    description: body.description?.trim() || '',
    phone: body.phone?.trim() || '',
    email: body.email?.trim() || '',
    gstin: body.gstin?.trim().toUpperCase() || '',
    address: body.address?.trim(),
    city: body.city?.trim(),
    state: body.state?.trim(),
    pinCode: body.pinCode?.trim(),
    openingTime: body.openingTime || '08:00',
    closingTime: body.closingTime || '21:00',
    deliveryAvailable: body.deliveryAvailable === true || body.deliveryAvailable === 'true',
    pickupAvailable: body.pickupAvailable === true || body.pickupAvailable === 'true',
  }
  if (body.deliveryRadius != null && body.deliveryRadius !== '') doc.deliveryRadius = Number(body.deliveryRadius)
  if (body.prepTimeMin != null && body.prepTimeMin !== '') doc.prepTimeMin = Number(body.prepTimeMin)
  if (body.prepTimeMax != null && body.prepTimeMax !== '') doc.prepTimeMax = Number(body.prepTimeMax)
  if (body.category) doc.category = body.category
  if (body.longitude != null && body.latitude != null && body.longitude !== '' && body.latitude !== '') {
    doc.location = point(body.longitude, body.latitude)
  }
  if (file) doc.logo = `/uploads/${file.filename}`
  if (body.isManuallyClosed != null) {
    doc.isManuallyClosed = body.isManuallyClosed === true || body.isManuallyClosed === 'true'
  }
  return doc
}

function assertShop(doc, { requireLocation }) {
  if (!doc.name || !doc.address || !doc.city || !doc.state || !doc.category) {
    throw new ApiError(400, 'Complete the shop details.')
  }
  if (!/^[1-9]\d{5}$/.test(doc.pinCode || '')) throw new ApiError(400, 'Enter a valid PIN code.')
  if (doc.phone && !/^[6-9]\d{9}$/.test(doc.phone)) throw new ApiError(400, 'Enter a 10-digit Indian mobile number.')
  if (doc.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(doc.gstin)) {
    throw new ApiError(400, 'Enter a valid GSTIN, or leave it blank.')
  }
  if (doc.deliveryRadius != null && (!Number.isFinite(doc.deliveryRadius) || doc.deliveryRadius < 1 || doc.deliveryRadius > 25)) {
    throw new ApiError(400, 'Delivery radius must be between 1 and 25 km.')
  }
  if (doc.prepTimeMin != null && (!Number.isFinite(doc.prepTimeMin) || doc.prepTimeMin < 5 || doc.prepTimeMin > 180)) {
    throw new ApiError(400, 'Earliest prep time must be between 5 and 180 minutes.')
  }
  if (doc.prepTimeMax != null && (!Number.isFinite(doc.prepTimeMax) || doc.prepTimeMax < 5 || doc.prepTimeMax > 240)) {
    throw new ApiError(400, 'Latest prep time must be between 5 and 240 minutes.')
  }
  if (doc.prepTimeMin != null && doc.prepTimeMax != null && doc.prepTimeMax < doc.prepTimeMin) {
    throw new ApiError(400, 'The latest prep time must be after the earliest.')
  }
  if (!doc.deliveryAvailable && !doc.pickupAvailable) throw new ApiError(400, 'Offer pickup, delivery, or both.')
  if (requireLocation && !doc.location) throw new ApiError(400, 'Select your shop location on the map.')
}

export const registerShop = asyncHandler(async (req, res) => {
  const existing = await Shop.findOne({ owner: req.user._id })
  if (existing) throw new ApiError(409, 'You already have a shop application.')
  const category = await Category.findById(req.body.category)
  if (!category) throw new ApiError(400, 'Choose a category.')
  const doc = shopBody(req.body, req.file)
  assertShop(doc, { requireLocation: true })
  const shop = await Shop.create({
    ...doc,
    owner: req.user._id,
    categories: [category._id],
    approvalStatus: 'PENDING_APPROVAL',
  })
  send(res, { shop }, 'Shop submitted for approval.', 201)
})

export const myShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id }).populate('category', 'name slug')
  send(res, { shop: shop ? withOpenFlag(shop) : null })
})

export const updateShop = asyncHandler(async (req, res) => {
  const shop = await ownedShop(req.user._id)
  const doc = shopBody(req.body, req.file)
  if (!req.file) delete doc.logo
  if (req.body.longitude == null || req.body.longitude === '') delete doc.location
  if (req.body.isManuallyClosed == null) delete doc.isManuallyClosed
  if (doc.category) {
    const category = await Category.findById(doc.category)
    if (!category) throw new ApiError(400, 'Choose a category.')
    shop.categories = [category._id]
  }
  Object.assign(shop, doc)
  assertShop(shop.toObject(), { requireLocation: false })
  if (!shop.location?.coordinates?.length) throw new ApiError(400, 'Select your shop location on the map.')
  await shop.save()
  send(res, { shop: withOpenFlag(shop) }, 'Shop updated.')
})

export const dashboard = asyncHandler(async (req, res) => {
  const shop = await ownedShop(req.user._id)
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const week = new Date(start)
  week.setDate(week.getDate() - 6)
  const done = ['DELIVERED', 'PICKED_UP', 'BILLED']
  const [todayAgg, statusAgg, trendAgg, productCount, lowStockProducts, recent] = await Promise.all([
    Order.aggregate([
      { $match: { shop: shop._id, createdAt: { $gte: start } } },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $in: ['$orderStatus', done] }, '$total', 0] } },
          customers: { $addToSet: '$customer' },
        },
      },
    ]),
    Order.aggregate([
      { $match: { shop: shop._id, orderStatus: { $in: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'] } } },
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { shop: shop._id, createdAt: { $gte: week }, orderStatus: { $nin: ['CANCELLED', 'REJECTED'] } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
      { $sort: { _id: 1 } },
    ]),
    Product.countDocuments({ shop: shop._id }),
    Product.find({
      shop: shop._id,
      $expr: { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] },
    }).select('name stock lowStockThreshold').sort({ stock: 1 }).limit(5),
    Order.find({ shop: shop._id }).sort({ createdAt: -1 }).limit(5).select('orderNumber orderStatus total fulfillmentMethod createdAt'),
  ])
  const completed = await Order.aggregate([
    { $match: { shop: shop._id, orderStatus: { $in: done } } },
    { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
  ])
  const attention = Object.fromEntries(statusAgg.map((row) => [row._id, row.count]))
  const revenue = round2(completed[0]?.revenue || 0)
  const completedOrders = completed[0]?.orders || 0
  send(res, {
    shop: withOpenFlag(shop),
    todayOrders: todayAgg[0]?.orders || 0,
    todayRevenue: round2(todayAgg[0]?.revenue || 0),
    pendingOrders: attention.PLACED || 0,
    products: productCount,
    lowStock: await Product.countDocuments({
      shop: shop._id,
      $expr: { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] },
    }),
    activeCustomers: (todayAgg[0]?.customers || []).filter(Boolean).length,
    averageOrder: completedOrders ? round2(revenue / completedOrders) : 0,
    attention,
    lowStockProducts,
    recentOrders: recent,
    trend: trendAgg.map((row) => ({ date: row._id, orders: row.orders, revenue: round2(row.revenue) })),
  })
})

export const listOrders = asyncHandler(async (req, res) => {
  const shop = await ownedShop(req.user._id)
  const { page, limit, skip } = pageParams(req.query)
  const filter = { shop: shop._id }
  if (req.query.status) filter.orderStatus = req.query.status
  const [orders, total] = await Promise.all([
    Order.find(filter).populate('customer', 'name phone').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ])
  send(res, {
    orders: orders.map((order) => {
      const plain = order.toObject()
      delete plain.pickupCode
      return plain
    }),
    pagination: pageMeta(total, page, limit),
  })
})

export const actOnOrder = asyncHandler(async (req, res) => {
  const shop = await ownedShop(req.user._id)
  const order = await Order.findOne({ _id: req.params.id, shop: shop._id })
  if (!order) throw new ApiError(404, 'Order not found.')
  const action = req.body.action
  const map = {
    accept: 'ACCEPTED',
    reject: 'REJECTED',
    prepare: 'PREPARING',
    ready: 'READY',
  }
  if (action === 'assign') {
    if (shop.approvalStatus !== 'APPROVED') throw new ApiError(400, 'Your shop is not approved yet.')
    const delivery = await assignDelivery(order, req.app.get('io'))
    send(res, { delivery }, 'Delivery partners have been notified.')
    return
  }
  if (action === 'pickup') {
    const updated = await transitionOrder({
      order,
      to: 'PICKED_UP',
      actor: req.user,
      note: 'Pickup code verified',
      pickupCode: req.body.pickupCode,
      io: req.app.get('io'),
    })
    send(res, { order: updated }, 'Pickup confirmed.')
    return
  }
  const to = map[action]
  if (!to) throw new ApiError(400, 'That action is not available.')
  const updated = await transitionOrder({
    order,
    to,
    actor: req.user,
    note: `Updated by shop`,
    io: req.app.get('io'),
  })
  send(res, { order: updated }, 'Order updated.')
})

function productDoc(body, file) {
  const doc = {
    name: body.name?.trim(),
    description: body.description?.trim() || '',
    category: body.category,
    price: Number(body.price),
    salePrice: body.salePrice === '' || body.salePrice == null ? null : Number(body.salePrice),
    unit: body.unit?.trim(),
    barcode: String(body.barcode || '').replace(/\s+/g, '').trim(),
    stock: Number(body.stock ?? 0),
    lowStockThreshold: Number(body.lowStockThreshold ?? 5),
    isAvailable: body.isAvailable === undefined ? true : body.isAvailable === true || body.isAvailable === 'true',
  }
  if (file) doc.images = [`/uploads/${file.filename}`]
  else if (body.image) doc.images = [body.image]
  return doc
}

function assertProduct(doc) {
  if (!doc.name || !doc.unit || !doc.category) throw new ApiError(400, 'Name, unit, and category are required.')
  if (!Number.isFinite(doc.price) || doc.price < 0) throw new ApiError(400, 'Enter a valid price.')
  if (doc.salePrice != null && (!Number.isFinite(doc.salePrice) || doc.salePrice < 0 || doc.salePrice >= doc.price)) {
    throw new ApiError(400, 'Sale price must be lower than the regular price.')
  }
  if (!Number.isFinite(doc.stock) || doc.stock < 0) throw new ApiError(400, 'Enter a valid stock count.')
  if (doc.barcode && !/^[0-9A-Za-z]{4,32}$/.test(doc.barcode)) {
    throw new ApiError(400, 'Enter a barcode of 4 to 32 letters or digits, or leave it blank.')
  }
}

async function assertBarcodeFree(shopId, barcode, exceptId) {
  if (!barcode) return
  const clash = await Product.findOne({ shop: shopId, barcode, ...(exceptId ? { _id: { $ne: exceptId } } : {}) })
  if (clash) throw new ApiError(400, 'Another product already uses that barcode.')
}

export const listProducts = asyncHandler(async (req, res) => {
  const shop = await ownedShop(req.user._id)
  const { page, limit, skip } = pageParams(req.query, 50)
  const filter = { shop: shop._id }
  const [products, total] = await Promise.all([
    Product.find(filter).populate('category', 'name slug').sort({ name: 1 }).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ])
  send(res, { products, pagination: pageMeta(total, page, limit) })
})

export const createProduct = asyncHandler(async (req, res) => {
  const shop = await ownedShop(req.user._id)
  const doc = productDoc(req.body, req.file)
  assertProduct(doc)
  await assertBarcodeFree(shop._id, doc.barcode)
  if (doc.stock === 0) doc.isAvailable = false
  const product = await Product.create({ ...doc, shop: shop._id, images: doc.images || [] })
  if (product.stock > 0) {
    await recordMovement({
      product: product._id,
      shop: shop._id,
      type: 'STOCK_RECEIVED',
      quantity: product.stock,
      reason: 'Opening stock',
    })
  }
  send(res, { product }, 'Product added.', 201)
})

export const updateProduct = asyncHandler(async (req, res) => {
  const shop = await ownedShop(req.user._id)
  const product = await Product.findOne({ _id: req.params.id, shop: shop._id })
  if (!product) throw new ApiError(404, 'Product not found.')
  const doc = productDoc(req.body, req.file)
  assertProduct(doc)
  await assertBarcodeFree(shop._id, doc.barcode, product._id)
  if (!doc.images) delete doc.images
  if (doc.stock === 0) doc.isAvailable = false
  if (doc.stock > 0 && bodyAvailable(req.body) !== false) doc.isAvailable = doc.isAvailable && doc.stock > 0
  const previousStock = product.stock
  Object.assign(product, doc)
  await product.save()
  const delta = product.stock - previousStock
  if (delta) {
    await recordMovement({
      product: product._id,
      shop: shop._id,
      type: 'MANUAL_ADJUSTMENT',
      quantity: delta,
      reason: 'Edited from inventory',
    })
  }
  send(res, { product }, 'Product updated.')
})

function bodyAvailable(body) {
  if (body.isAvailable === undefined) return undefined
  return body.isAvailable === true || body.isAvailable === 'true'
}

export const deleteProduct = asyncHandler(async (req, res) => {
  const shop = await ownedShop(req.user._id)
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, shop: shop._id },
    { isDeleted: true, isAvailable: false },
    { new: true }
  )
  if (!product) throw new ApiError(404, 'Product not found.')
  send(res, { ok: true }, 'Product removed from the catalog.')
})

function inventoryItem(product) {
  const category = product.category
  return {
    _id: product._id,
    name: product.name,
    description: product.description || '',
    category: category?._id || category || '',
    price: product.price,
    salePrice: product.salePrice,
    unit: product.unit,
    barcode: product.barcode || '',
    image: product.images?.[0] || '',
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold,
    status: product.stock <= 0 ? 'OUT' : product.stock <= product.lowStockThreshold ? 'LOW' : 'IN',
    isAvailable: product.isAvailable,
  }
}

export const inventory = asyncHandler(async (req, res) => {
  const shop = await ownedShop(req.user._id)
  const products = await Product.find({ shop: shop._id }).populate('category', 'name').sort({ stock: 1, name: 1 })
  const movements = await InventoryMovement.find({ shop: shop._id })
    .populate('product', 'name')
    .sort({ createdAt: -1 })
    .limit(12)
  send(res, { products: products.map(inventoryItem), movements })
})

const PHONE = /^[6-9]\d{9}$/

export const createBill = asyncHandler(async (req, res) => {
  const shop = await ownedShop(req.user._id)
  const method = req.body.paymentMethod
  if (!['CASH', 'UPI', 'CARD'].includes(method)) throw new ApiError(400, 'Choose cash, UPI, or card.')

  const raw = Array.isArray(req.body.items) ? req.body.items : []
  if (!raw.length) throw new ApiError(400, 'Add at least one product to the bill.')
  const merged = new Map()
  for (const line of raw) {
    const quantity = Number(line.quantity)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) {
      throw new ApiError(400, 'Enter a whole quantity for each product.')
    }
    const id = String(line.product || '')
    if (!id) throw new ApiError(400, 'Choose a product for each line.')
    merged.set(id, (merged.get(id) || 0) + quantity)
  }

  const products = await Product.find({ _id: { $in: [...merged.keys()] }, shop: shop._id })
  if (products.length !== merged.size) throw new ApiError(400, 'A product on this bill is not in your shop.')
  const byId = new Map(products.map((product) => [String(product._id), product]))
  const lines = [...merged.entries()].map(([id, quantity]) => {
    const product = byId.get(id)
    if (!product.isAvailable || product.stock < quantity) {
      throw new ApiError(400, `${product.name} does not have enough stock.`)
    }
    return {
      product: product._id,
      name: product.name,
      price: unitPrice(product),
      quantity,
      unit: product.unit,
      image: product.images?.[0] || '',
    }
  })

  const customerName = String(req.body.customerName || '').trim().slice(0, 80) || 'Walk-in'
  const customerPhone = String(req.body.customerPhone || '').trim()
  if (customerPhone && !PHONE.test(customerPhone)) {
    throw new ApiError(400, 'Enter a 10-digit mobile number, or leave it blank.')
  }

  await reserveStock(lines)
  const orderNumber = await Counter.nextOrderNumber()
  const subtotal = round2(lines.reduce((sum, line) => sum + line.price * line.quantity, 0))
  const totals = quoteTotals({ subtotal, distanceKm: 0, fulfillment: 'COUNTER' })
  try {
    const order = await Order.create({
      orderNumber,
      channel: 'COUNTER',
      customerName,
      customerPhone,
      shop: shop._id,
      items: lines,
      subtotal: totals.subtotal,
      deliveryFee: 0,
      tax: totals.tax,
      discount: 0,
      total: totals.total,
      fulfillmentMethod: 'COUNTER',
      paymentMethod: method,
      paymentStatus: 'PAID',
      paymentProvider: 'counter',
      paymentNote: 'Collected at the counter.',
      orderStatus: 'BILLED',
      notes: String(req.body.notes || '').trim().slice(0, 300),
      distanceKm: 0,
      etaMin: 0,
      etaMax: 0,
      statusHistory: [{ status: 'BILLED', note: 'Counter bill' }],
    })
    send(res, { order }, 'Bill created.', 201)
  } catch (error) {
    await restoreStock(lines)
    throw error
  }
})

export const addStock = asyncHandler(async (req, res) => {
  const shop = await ownedShop(req.user._id)
  const quantity = Number(req.body.quantity)
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) {
    throw new ApiError(400, 'Enter a whole quantity of at least 1.')
  }
  const product = await Product.findOne({ _id: req.params.id, shop: shop._id })
  if (!product) throw new ApiError(404, 'Product not found.')
  await adjustStock(product, quantity, { type: 'STOCK_RECEIVED', reason: 'Stock received' })
  send(res, { product: inventoryItem(product) }, 'Stock added.')
})

export const analytics = asyncHandler(async (req, res) => {
  const shop = await ownedShop(req.user._id)
  const done = ['DELIVERED', 'PICKED_UP', 'BILLED']
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - 6)
  const [summary, best, statusAgg, days, lowStock] = await Promise.all([
    Order.aggregate([
      { $match: { shop: shop._id, orderStatus: { $in: done } } },
      { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { shop: shop._id, orderStatus: { $in: done } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', quantity: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
    ]),
    Order.aggregate([
      { $match: { shop: shop._id } },
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { shop: shop._id, orderStatus: { $in: done }, createdAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' } } },
      { $sort: { _id: 1 } },
    ]),
    Product.countDocuments({
      shop: shop._id,
      $expr: { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] },
    }),
  ])
  const revenue = round2(summary[0]?.revenue || 0)
  const orders = summary[0]?.orders || 0
  send(res, {
    revenue,
    orders,
    averageOrderValue: orders ? round2(revenue / orders) : 0,
    lowStock,
    bestSellers: best.map((row) => ({ name: row._id, quantity: row.quantity, revenue: round2(row.revenue) })),
    revenueOverTime: days.map((row) => ({
      date: new Date(row._id).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      revenue: round2(row.revenue),
    })),
    statusDistribution: statusAgg.map((row) => ({ status: row._id, count: row.count })),
  })
})
