import mongoose from 'mongoose'
import Shop from '../models/Shop.js'
import Product from '../models/Product.js'
import Category from '../models/Category.js'
import Order from '../models/Order.js'
import { ApiError } from '../utils/http.js'
import { assertCoordinates, haversineKm, metersToKm } from '../utils/geo.js'
import { isShopOpen, withOpenFlag } from '../utils/hours.js'

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function nearbyShops({
  longitude,
  latitude,
  radius = 5000,
  pickup,
  delivery,
  category,
  open,
  limit = 24,
}) {
  const coords = assertCoordinates(longitude, latitude)
  if (coords.error) throw coords.error

  const query = { approvalStatus: 'APPROVED' }
  if (pickup === 'true' || pickup === true) query.pickupAvailable = true
  if (delivery === 'true' || delivery === true) query.deliveryAvailable = true
  if (category && mongoose.isValidObjectId(category)) {
    const categoryId = new mongoose.Types.ObjectId(category)
    query.$or = [{ category: categoryId }, { categories: categoryId }]
  }

  const rows = await Shop.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [coords.lng, coords.lat] },
        distanceField: 'distanceMeters',
        maxDistance: Number(radius) || 5000,
        spherical: true,
        query,
      },
    },
    { $limit: 60 },
  ])

  const ids = rows.map((row) => row._id)
  const populated = await Shop.find({ _id: { $in: ids } })
    .populate('category', 'name slug')
    .populate('categories', 'name slug')
  const byId = new Map(populated.map((shop) => [String(shop._id), shop]))

  let results = rows
    .map((row) => {
      const shop = byId.get(String(row._id))
      if (!shop) return null
      const plain = withOpenFlag(shop)
      return { shop: plain, distance: metersToKm(row.distanceMeters) }
    })
    .filter(Boolean)

  if (open === 'true' || open === true) {
    results = results.filter((row) => row.shop.isOpen)
  }

  return results.slice(0, Number(limit) || 24)
}

export async function publicShop(id, longitude, latitude) {
  const shop = await Shop.findOne({ _id: id, approvalStatus: 'APPROVED' })
    .populate('category', 'name slug')
    .populate('categories', 'name slug')
  if (!shop) throw new ApiError(404, 'That shop is not available.')
  const plain = withOpenFlag(shop)
  let distance = null
  if (longitude != null && latitude != null && longitude !== '' && latitude !== '') {
    const coords = assertCoordinates(longitude, latitude)
    if (!coords.error) {
      const meters = await distanceToShop(shop._id, coords.lng, coords.lat)
      distance = meters == null ? null : metersToKm(meters)
    }
  }
  return { shop: plain, distance }
}

async function distanceToShop(shopId, lng, lat) {
  const rows = await Shop.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng, lat] },
        distanceField: 'distanceMeters',
        spherical: true,
        query: { _id: new mongoose.Types.ObjectId(shopId) },
      },
    },
    { $limit: 1 },
  ])
  return rows[0]?.distanceMeters ?? null
}

export async function shopProducts(shopId, { q, category } = {}) {
  const shop = await Shop.findOne({ _id: shopId, approvalStatus: 'APPROVED' })
  if (!shop) throw new ApiError(404, 'That shop is not available.')
  const filter = { shop: shopId }
  if (category) filter.category = category
  if (q) filter.name = new RegExp(escapeRegex(q), 'i')
  return Product.find(filter).populate('category', 'name slug').sort({ name: 1 })
}

function matchesTerm(regex, ...values) {
  return values.some((value) => regex.test(value || ''))
}

export async function searchMarketplace({
  q,
  longitude,
  latitude,
  pickup,
  delivery,
  category,
  open,
  minPrice,
  maxPrice,
  page = 1,
  limit = 20,
}) {
  const coords = assertCoordinates(longitude, latitude)
  if (coords.error) throw coords.error

  const term = String(q || '').trim()
  const regex = term ? new RegExp(escapeRegex(term), 'i') : null
  const shopQuery = { approvalStatus: 'APPROVED' }
  if (pickup === 'true' || pickup === true) shopQuery.pickupAvailable = true
  if (delivery === 'true' || delivery === true) shopQuery.deliveryAvailable = true
  if (category && mongoose.isValidObjectId(category)) {
    const categoryId = new mongoose.Types.ObjectId(category)
    shopQuery.$or = [{ category: categoryId }, { categories: categoryId }]
  }

  const shops = await Shop.find(shopQuery).populate('category', 'name slug').populate('categories', 'name slug')
  let rows = shops.map((shop) => {
    const plain = withOpenFlag(shop)
    const coordinates = shop.location?.coordinates
    const distance = Array.isArray(coordinates) && coordinates.length === 2
      ? Math.round(haversineKm([coords.lng, coords.lat], coordinates) * 100) / 100
      : null
    return { shop: plain, distance }
  })
  if (open === 'true' || open === true) rows = rows.filter((row) => row.shop.isOpen)

  const shopMatches = regex
    ? rows.filter((row) => matchesTerm(
      regex,
      row.shop.name,
      row.shop.description,
      row.shop.category?.name,
      ...(row.shop.categories || []).map((item) => item?.name),
    )).sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
    : []

  const shopIds = rows.map((row) => row.shop._id)
  const shopById = new Map(rows.map((row) => [String(row.shop._id), row.shop]))
  const distanceByShop = new Map(rows.map((row) => [String(row.shop._id), row.distance]))
  const productFilter = { shop: { $in: shopIds }, isAvailable: true }
  if (regex) {
    const categories = await Category.find({ name: regex })
    productFilter.$or = [{ name: regex }]
    if (categories.length) productFilter.$or.push({ category: { $in: categories.map((item) => item._id) } })
  }
  if (minPrice !== undefined && minPrice !== '' && Number.isFinite(Number(minPrice))) {
    productFilter.price = { ...(productFilter.price || {}), $gte: Number(minPrice) }
  }
  if (maxPrice !== undefined && maxPrice !== '' && Number.isFinite(Number(maxPrice))) {
    productFilter.price = { ...(productFilter.price || {}), $lte: Number(maxPrice) }
  }

  const pageNumber = Math.max(1, Math.floor(Number(page) || 1))
  const pageSize = Math.min(40, Math.max(1, Math.floor(Number(limit) || 20)))
  const products = shopIds.length
    ? await Product.find(productFilter).populate('category', 'name slug').limit(80)
    : []
  const productResults = products
    .map((product) => ({
      product,
      shop: shopById.get(String(product.shop)),
      distance: distanceByShop.get(String(product.shop)) ?? null,
    }))
    .filter((row) => row.shop)
    .sort((a, b) => {
      const openBoost = Number(b.shop?.isOpen) - Number(a.shop?.isOpen)
      if (openBoost) return openBoost
      return (a.distance ?? Infinity) - (b.distance ?? Infinity)
    })

  const start = (pageNumber - 1) * pageSize
  return {
    shops: shopMatches.slice(0, pageSize),
    products: productResults.slice(start, start + pageSize),
    pagination: {
      page: pageNumber,
      limit: pageSize,
      total: productResults.length,
      pages: Math.max(1, Math.ceil(productResults.length / pageSize)),
    },
  }
}

const skippedOrders = ['CANCELLED', 'REJECTED']

function shopDistance(shop, coords) {
  const coordinates = shop?.location?.coordinates
  if (!coords || !Array.isArray(coordinates) || coordinates.length !== 2) return null
  return Math.round(haversineKm([coords.lng, coords.lat], coordinates) * 100) / 100
}

export async function productInsights({ product, customerId, longitude, latitude }) {
  const coords = assertCoordinates(longitude, latitude)
  const origin = coords.error ? null : coords
  const since = new Date()
  since.setDate(since.getDate() - 30)
  const productId = String(product._id)

  const [personal, baskets, recent, shelf] = await Promise.all([
    customerId
      ? Order.find({
        customer: customerId,
        orderStatus: { $nin: skippedOrders },
        'items.product': product._id,
      }).sort({ createdAt: -1 }).limit(6).select('orderNumber items orderStatus createdAt')
      : [],
    Order.find({
      orderStatus: { $nin: skippedOrders },
      'items.product': product._id,
    }).select('items').limit(200),
    Order.find({
      orderStatus: { $nin: skippedOrders },
      createdAt: { $gte: since },
    }).select('items').limit(300),
    Product.find({
      _id: { $ne: product._id },
      isAvailable: true,
      $or: [{ shop: product.shop }, { category: product.category?._id || product.category }],
    }).limit(12),
  ])

  const history = personal.map((order) => {
    const line = order.items.find((item) => String(item.product) === productId)
    return {
      _id: order._id,
      orderNumber: order.orderNumber,
      quantity: line?.quantity || 0,
      price: line?.price,
      status: order.orderStatus,
      at: order.createdAt,
    }
  })

  const pairCounts = new Map()
  baskets.forEach((order) => {
    const seen = new Set()
    order.items.forEach((item) => {
      if (!item.product || String(item.product) === productId || seen.has(String(item.product))) return
      seen.add(String(item.product))
      const key = String(item.product)
      pairCounts.set(key, (pairCounts.get(key) || 0) + 1)
    })
  })

  const trendCounts = new Map()
  recent.forEach((order) => {
    const seen = new Set()
    order.items.forEach((item) => {
      if (!item.product || seen.has(String(item.product))) return
      seen.add(String(item.product))
      const key = String(item.product)
      const current = trendCounts.get(key) || { orders: 0, quantity: 0 }
      current.orders += 1
      current.quantity += Number(item.quantity) || 0
      trendCounts.set(key, current)
    })
  })

  const ranked = [...trendCounts.entries()].sort((a, b) => b[1].quantity - a[1].quantity || b[1].orders - a[1].orders)
  const rank = ranked.findIndex(([id]) => id === productId) + 1
  const ids = [...new Set([
    ...pairCounts.keys(),
    ...ranked.slice(0, 8).map(([id]) => id),
    ...shelf.map((item) => String(item._id)),
  ])]
  const related = await Product.find({ _id: { $in: ids }, isAvailable: true }).populate('category', 'name slug')
  const shops = await Shop.find({
    _id: { $in: related.map((item) => item.shop) },
    approvalStatus: 'APPROVED',
  }).select('name location')
  const shopById = new Map(shops.map((shop) => [String(shop._id), shop]))
  const productById = new Map(related.map((item) => [String(item._id), item]))

  function card(id, note) {
    const item = productById.get(String(id))
    const shop = item ? shopById.get(String(item.shop)) : null
    if (!item || !shop || String(item._id) === productId) return null
    return {
      product: item,
      shop: { _id: shop._id, name: shop.name },
      distance: shopDistance(shop, origin),
      note,
    }
  }

  const paired = [...pairCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, times]) => card(id, times > 1 ? `In ${times} orders with this` : 'Ordered with this'))
    .filter(Boolean)
    .slice(0, 4)

  const pairedIds = new Set(paired.map((row) => String(row.product._id)))
  const suggestions = shelf
    .map((item) => {
      if (pairedIds.has(String(item._id))) return null
      const sameShop = String(item.shop) === String(product.shop)
      return card(item._id, sameShop ? 'Also at this shop' : 'Same category')
    })
    .filter(Boolean)
    .slice(0, 4)

  const trends = ranked
    .slice(0, 5)
    .map(([id, stats], index) => {
      const row = card(id, '')
      const current = id === productId
      const item = current ? product : row?.product
      if (!item) return null
      return {
        product: { _id: item._id, name: item.name, images: item.images, unit: item.unit },
        shop: current ? null : row.shop,
        orders: stats.orders,
        quantity: stats.quantity,
        rank: index + 1,
        current,
      }
    })
    .filter(Boolean)

  const own = trendCounts.get(productId) || { orders: 0, quantity: 0 }
  return {
    history,
    bought: history.reduce((sum, row) => sum + row.quantity, 0),
    demand: {
      orders: baskets.length,
      monthOrders: own.orders,
      monthQuantity: own.quantity,
      rank: rank || null,
    },
    paired,
    suggestions,
    trends,
  }
}

export { isShopOpen }
