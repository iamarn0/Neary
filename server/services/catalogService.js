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

function pageArgs(page, limit) {
  const pageNumber = Math.max(1, Math.floor(Number(page) || 1))
  const pageSize = Math.min(20, Math.max(1, Math.floor(Number(limit) || 12)))
  return { pageNumber, pageSize }
}

async function shopsNear(coords, shopQuery, radius) {
  const geoRows = await Shop.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [coords.lng, coords.lat] },
        distanceField: 'distanceMeters',
        maxDistance: radius,
        spherical: true,
        query: shopQuery,
      },
    },
    { $limit: 40 },
    { $project: { distanceMeters: 1 } },
  ])
  const ids = geoRows.map((row) => row._id)
  const populated = ids.length
    ? await Shop.find({ _id: { $in: ids } }).populate('category', 'name slug').populate('categories', 'name slug')
    : []
  const byId = new Map(populated.map((shop) => [String(shop._id), shop]))
  return geoRows.map((row) => {
    const shop = byId.get(String(row._id))
    if (!shop) return null
    return { shop: withOpenFlag(shop), distance: metersToKm(row.distanceMeters) }
  }).filter(Boolean)
}

const skippedOrders = ['CANCELLED', 'REJECTED']

export async function nearbyProducts({ longitude, latitude, radius = 12000, limit = 8 }) {
  const coords = assertCoordinates(longitude, latitude)
  if (coords.error) throw coords.error
  const rows = await shopsNear(
    coords,
    { approvalStatus: 'APPROVED' },
    Math.min(20000, Math.max(500, Number(radius) || 12000)),
  )
  const shopIds = rows.map((row) => row.shop._id)
  if (!shopIds.length) return []
  const byShop = new Map(rows.map((row) => [String(row.shop._id), row]))
  const counts = await Order.aggregate([
    { $match: { shop: { $in: shopIds }, orderStatus: { $nin: skippedOrders } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.product', orders: { $sum: 1 } } },
    { $sort: { orders: -1 } },
    { $limit: 24 },
  ])
  const rankedIds = counts.map((row) => row._id).filter(Boolean)
  const orderCount = new Map(counts.map((row) => [String(row._id), row.orders]))
  const products = await Product.find({
    shop: { $in: shopIds },
    isAvailable: true,
    stock: { $gt: 0 },
    ...(rankedIds.length ? { _id: { $in: rankedIds } } : {}),
  }).limit(rankedIds.length ? 24 : Number(limit) || 8)
  return products
    .map((product) => {
      const row = byShop.get(String(product.shop))
      if (!row) return null
      return {
        product,
        shop: row.shop,
        distance: row.distance,
        orders: orderCount.get(String(product._id)) || 0,
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.orders - a.orders || Number(b.shop.isOpen) - Number(a.shop.isOpen) || (a.distance ?? 99) - (b.distance ?? 99))
    .slice(0, Number(limit) || 8)
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
  sort = 'relevance',
  radius = 12000,
  page = 1,
  limit = 12,
}) {
  const coords = assertCoordinates(longitude, latitude)
  if (coords.error) throw coords.error
  const { pageNumber, pageSize } = pageArgs(page, limit)
  const term = String(q || '').trim()
  const empty = {
    shops: [],
    products: [],
    suggestions: [],
    pagination: { page: 1, limit: pageSize, total: 0, pages: 1, shopTotal: 0 },
  }
  if (!term) return empty

  const shopQuery = { approvalStatus: 'APPROVED' }
  if (pickup === 'true' || pickup === true) shopQuery.pickupAvailable = true
  if (delivery === 'true' || delivery === true) shopQuery.deliveryAvailable = true
  if (category && mongoose.isValidObjectId(category)) {
    const categoryId = new mongoose.Types.ObjectId(category)
    shopQuery.$or = [{ category: categoryId }, { categories: categoryId }]
  }

  let rows = await shopsNear(coords, shopQuery, Math.min(20000, Math.max(500, Number(radius) || 12000)))
  if (open === 'true' || open === true) rows = rows.filter((row) => row.shop.isOpen)

  const regex = new RegExp(escapeRegex(term), 'i')
  const shopMatches = rows
    .filter((row) => matchesTerm(
      regex,
      row.shop.name,
      row.shop.description,
      row.shop.category?.name,
      ...(row.shop.categories || []).map((item) => item?.name),
    ))
    .sort((a, b) => Number(b.shop.isOpen) - Number(a.shop.isOpen) || (a.distance ?? 99) - (b.distance ?? 99))

  const shopIds = rows.map((row) => row.shop._id)
  if (!shopIds.length) {
    return { ...empty, pagination: { ...empty.pagination, page: pageNumber } }
  }

  const categories = await Category.find({ name: regex }).select('_id')
  const productMatch = {
    shop: { $in: shopIds },
    isAvailable: true,
    isDeleted: { $ne: true },
    $or: [{ name: regex }],
  }
  if (categories.length) productMatch.$or.push({ category: { $in: categories.map((item) => item._id) } })
  const price = {}
  if (minPrice !== undefined && minPrice !== '' && Number.isFinite(Number(minPrice))) price.$gte = Number(minPrice)
  if (maxPrice !== undefined && maxPrice !== '' && Number.isFinite(Number(maxPrice))) price.$lte = Number(maxPrice)
  if (Object.keys(price).length) productMatch.price = price

  const openIds = rows.filter((row) => row.shop.isOpen).map((row) => row.shop._id)
  const distanceBranches = rows.map((row) => ({
    case: { $eq: ['$shop', row.shop._id] },
    then: row.distance ?? 999,
  }))
  const sortStage = sort === 'price'
    ? { price: 1, distance: 1, name: 1 }
    : sort === 'distance'
      ? { distance: 1, name: 1 }
      : { shopOpen: -1, distance: 1, name: 1 }

  const [facet] = await Product.aggregate([
    { $match: productMatch },
    {
      $addFields: {
        distance: { $switch: { branches: distanceBranches, default: 999 } },
        shopOpen: { $cond: [{ $in: ['$shop', openIds] }, 1, 0] },
      },
    },
    { $sort: sortStage },
    {
      $facet: {
        page: [{ $skip: (pageNumber - 1) * pageSize }, { $limit: pageSize }, { $project: { _id: 1, shop: 1 } }],
        meta: [{ $count: 'total' }],
      },
    },
  ])

  const pageDocs = facet?.page || []
  const total = facet?.meta?.[0]?.total || 0
  const hydrated = pageDocs.length
    ? await Product.find({ _id: { $in: pageDocs.map((doc) => doc._id) } }).populate('category', 'name slug')
    : []
  const productById = new Map(hydrated.map((item) => [String(item._id), item]))
  const shopById = new Map(rows.map((row) => [String(row.shop._id), row]))
  const products = pageDocs.map((doc) => {
    const product = productById.get(String(doc._id))
    const row = shopById.get(String(doc.shop))
    if (!product || !row) return null
    return { product, shop: row.shop, distance: row.distance }
  }).filter(Boolean)

  const suggestions = [...new Set([
    ...products.slice(0, 4).map((row) => row.product.name),
    ...shopMatches.slice(0, 4).map((row) => row.shop.name),
  ])].slice(0, 6)

  return {
    shops: shopMatches.slice(0, pageSize).map(({ shop, distance }) => ({ shop, distance })),
    products,
    suggestions,
    pagination: {
      page: pageNumber,
      limit: pageSize,
      total,
      pages: Math.max(1, Math.ceil(total / pageSize)),
      shopTotal: shopMatches.length,
    },
  }
}

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

  const [personal, pairRows, trendRows, ownRows, demandCount, shelf] = await Promise.all([
    customerId
      ? Order.find({
        customer: customerId,
        orderStatus: { $nin: skippedOrders },
        'items.product': product._id,
      }).sort({ createdAt: -1 }).limit(6).select('orderNumber items orderStatus createdAt')
      : [],
    Order.aggregate([
      { $match: { orderStatus: { $nin: skippedOrders }, 'items.product': product._id } },
      { $unwind: '$items' },
      { $match: { 'items.product': { $ne: product._id } } },
      { $group: { _id: '$items.product', times: { $sum: 1 } } },
      { $sort: { times: -1 } },
      { $limit: 6 },
    ]),
    Order.aggregate([
      { $match: { orderStatus: { $nin: skippedOrders }, createdAt: { $gte: since } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', orders: { $sum: 1 }, quantity: { $sum: '$items.quantity' } } },
      { $sort: { quantity: -1, orders: -1 } },
      { $limit: 8 },
    ]),
    Order.aggregate([
      { $match: { orderStatus: { $nin: skippedOrders }, createdAt: { $gte: since }, 'items.product': product._id } },
      { $unwind: '$items' },
      { $match: { 'items.product': product._id } },
      { $group: { _id: null, orders: { $sum: 1 }, quantity: { $sum: '$items.quantity' } } },
    ]),
    Order.countDocuments({ orderStatus: { $nin: skippedOrders }, 'items.product': product._id }),
    Product.find({
      _id: { $ne: product._id },
      isAvailable: true,
      $or: [{ shop: product.shop }, { category: product.category?._id || product.category }],
    }).limit(8),
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

  const pairCounts = new Map(pairRows.map((row) => [String(row._id), row.times]))
  const ranked = trendRows.map((row) => [String(row._id), { orders: row.orders, quantity: row.quantity }])
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

  const own = ownRows[0] || { orders: 0, quantity: 0 }
  return {
    history,
    bought: history.reduce((sum, row) => sum + row.quantity, 0),
    demand: {
      orders: demandCount,
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
