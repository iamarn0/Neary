import Category from '../models/Category.js'
import Product from '../models/Product.js'
import Shop from '../models/Shop.js'
import Review from '../models/Review.js'
import User from '../models/User.js'
import { ApiError, asyncHandler, send } from '../utils/http.js'
import { nearbyShops, productInsights, publicShop, searchMarketplace, shopProducts } from '../services/catalogService.js'
import { withOpenFlag } from '../utils/hours.js'
import { pageMeta, pageParams } from '../utils/pagination.js'

export const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 })
  send(res, { categories })
})

export const listNearby = asyncHandler(async (req, res) => {
  const shops = await nearbyShops(req.query)
  send(res, { shops })
})

export const getShop = asyncHandler(async (req, res) => {
  const result = await publicShop(req.params.id, req.query.longitude, req.query.latitude)
  send(res, result)
})

export const getShopProducts = asyncHandler(async (req, res) => {
  const products = await shopProducts(req.params.id, req.query)
  send(res, { products })
})

export const getShopReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query, 10)
  const filter = { shop: req.params.id }
  const [reviews, total] = await Promise.all([
    Review.find(filter).populate('customer', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Review.countDocuments(filter),
  ])
  send(res, { reviews, pagination: pageMeta(total, page, limit) })
})

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name slug')
  if (!product) throw new ApiError(404, 'That product is not available.')
  const shopDoc = await Shop.findOne({ _id: product.shop, approvalStatus: 'APPROVED' })
    .populate('category', 'name slug')
  if (!shopDoc) throw new ApiError(404, 'That product is not available.')
  let distance = null
  if (req.query.longitude && req.query.latitude) {
    const nearby = await nearbyShops({
      longitude: req.query.longitude,
      latitude: req.query.latitude,
      radius: 50000,
      limit: 50,
    })
    distance = nearby.find((row) => String(row.shop._id) === String(shopDoc._id))?.distance ?? null
  }
  const insights = await productInsights({
    product,
    customerId: req.user?.role === 'CUSTOMER' ? req.user._id : null,
    longitude: req.query.longitude,
    latitude: req.query.latitude,
  })
  send(res, { product, shop: withOpenFlag(shopDoc), distance, insights })
})

export const search = asyncHandler(async (req, res) => {
  if (!String(req.query.q || '').trim()) {
    send(res, { shops: [], products: [] })
    return
  }
  const results = await searchMarketplace(req.query)
  send(res, results)
})

export const toggleFavorite = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ _id: req.params.id, approvalStatus: 'APPROVED' })
  if (!shop) throw new ApiError(404, 'That shop is not available.')
  const user = await User.findById(req.user._id)
  const exists = user.favoriteShops.some((id) => String(id) === String(shop._id))
  user.favoriteShops = exists
    ? user.favoriteShops.filter((id) => String(id) !== String(shop._id))
    : [...user.favoriteShops, shop._id]
  await user.save()
  send(res, { favorite: !exists, favoriteShops: user.favoriteShops })
})

export const toggleProductFavorite = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) throw new ApiError(404, 'That product is not available.')
  const user = await User.findById(req.user._id)
  if (!Array.isArray(user.favoriteProducts)) user.favoriteProducts = []
  const exists = user.favoriteProducts.some((id) => String(id) === String(product._id))
  user.favoriteProducts = exists
    ? user.favoriteProducts.filter((id) => String(id) !== String(product._id))
    : [...user.favoriteProducts, product._id]
  await user.save()
  send(res, { favorite: !exists })
})

export const listFavorites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  const shops = await Shop.find({ _id: { $in: user.favoriteShops }, approvalStatus: 'APPROVED' })
    .populate('category', 'name slug')
  const rows = []
  if (req.query.longitude && req.query.latitude) {
    const nearby = await nearbyShops({
      longitude: req.query.longitude,
      latitude: req.query.latitude,
      radius: 50000,
      limit: 50,
    })
    const distance = new Map(nearby.map((row) => [String(row.shop._id), row.distance]))
    shops.forEach((shop) => {
      rows.push({ shop: withOpenFlag(shop), distance: distance.get(String(shop._id)) ?? null })
    })
  } else {
    shops.forEach((shop) => rows.push({ shop: withOpenFlag(shop), distance: null }))
  }
  const products = await Product.find({ _id: { $in: user.favoriteProducts || [] }, isAvailable: true })
    .populate({ path: 'shop', select: 'name approvalStatus' })
  send(res, {
    shops: rows,
    products: products.filter((product) => product.shop && product.shop.approvalStatus === 'APPROVED'),
  })
})
