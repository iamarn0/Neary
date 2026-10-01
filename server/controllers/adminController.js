import User from '../models/User.js'
import Shop from '../models/Shop.js'
import Product from '../models/Product.js'
import Category from '../models/Category.js'
import Order from '../models/Order.js'
import Delivery from '../models/Delivery.js'
import Review from '../models/Review.js'
import { ApiError, asyncHandler, send } from '../utils/http.js'
import { withOpenFlag } from '../utils/hours.js'
import { round2 } from '../utils/money.js'
import { pageMeta, pageParams } from '../utils/pagination.js'
import { notify } from '../services/notificationService.js'

function slugify(value) {
  return String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export const dashboard = asyncHandler(async (req, res) => {
  const completed = ['DELIVERED', 'PICKED_UP', 'BILLED']
  const since = new Date()
  since.setDate(since.getDate() - 30)
  const [customers, shops, partners, orders, gmvAgg, activeOrders, pendingShops, pendingPartners, fulfillment, trend] = await Promise.all([
    User.countDocuments({ role: 'CUSTOMER', isActive: true }),
    Shop.countDocuments({ approvalStatus: 'APPROVED' }),
    User.countDocuments({ role: 'DELIVERY_PARTNER', 'partnerProfile.partnerStatus': 'APPROVED' }),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { orderStatus: { $in: completed } } },
      { $group: { _id: null, gmv: { $sum: '$total' } } },
    ]),
    Order.countDocuments({ orderStatus: { $in: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'] } }),
    Shop.countDocuments({ approvalStatus: 'PENDING_APPROVAL' }),
    User.countDocuments({ role: 'DELIVERY_PARTNER', 'partnerProfile.partnerStatus': 'PENDING' }),
    Order.aggregate([
      { $match: { orderStatus: { $in: completed } } },
      { $group: { _id: '$fulfillmentMethod', count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: since }, orderStatus: { $nin: ['CANCELLED', 'REJECTED'] } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
      { $sort: { _id: 1 } },
    ]),
  ])
  send(res, {
    gmv: round2(gmvAgg[0]?.gmv || 0),
    orders,
    customers,
    shops,
    deliveryPartners: partners,
    activeOrders,
    pendingShops,
    pendingPartners,
    deliveryOrders: fulfillment.find((row) => row._id === 'DELIVERY')?.count || 0,
    pickupOrders: fulfillment.find((row) => row._id === 'PICKUP')?.count || 0,
    trend: trend.map((row) => ({ date: row._id, orders: row.orders, revenue: round2(row.revenue) })),
  })
})

export const users = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query)
  const filter = {}
  if (req.query.role) filter.role = req.query.role
  if (req.query.q) {
    const term = String(req.query.q).trim().slice(0, 80)
    filter.$or = [
      { name: new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
      { email: new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
    ]
  }
  const [rows, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ])
  send(res, { users: rows, pagination: pageMeta(total, page, limit) })
})

export const setUserActive = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) throw new ApiError(400, 'You cannot deactivate your own account.')
  const user = await User.findById(req.params.id)
  if (!user) throw new ApiError(404, 'User not found.')
  user.isActive = Boolean(req.body.isActive)
  await user.save()
  send(res, { user }, user.isActive ? 'User activated.' : 'User deactivated.')
})

export const shops = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query)
  const filter = {}
  if (req.query.status) filter.approvalStatus = req.query.status
  const [rows, total] = await Promise.all([
    Shop.find(filter).populate('owner', 'name email phone').populate('category', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Shop.countDocuments(filter),
  ])
  send(res, { shops: rows.map((shop) => withOpenFlag(shop)), pagination: pageMeta(total, page, limit) })
})

export const decideShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id)
  if (!shop) throw new ApiError(404, 'Shop not found.')
  const approve = req.body.action === 'approve'
  shop.approvalStatus = approve ? 'APPROVED' : 'REJECTED'
  shop.rejectionNote = approve ? '' : (req.body.note || 'Application was not approved.')
  await shop.save()
  await notify(req.app.get('io'), {
    recipient: shop.owner,
    type: approve ? 'SHOP_APPROVED' : 'SHOP_REJECTED',
    title: approve ? 'Shop approved' : 'Shop not approved',
    message: approve ? `${shop.name} is now visible on NEARE.` : shop.rejectionNote,
  })
  send(res, { shop }, approve ? 'Shop approved.' : 'Shop rejected.')
})

export const orders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query)
  const filter = {}
  if (req.query.status) filter.orderStatus = req.query.status
  const [rows, total] = await Promise.all([
    Order.find(filter).populate('customer', 'name').populate('shop', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ])
  send(res, { orders: rows, pagination: pageMeta(total, page, limit) })
})

export const products = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query)
  const [rows, total] = await Promise.all([
    Product.find().populate('shop', 'name').populate('category', 'name').sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(),
  ])
  send(res, { products: rows, pagination: pageMeta(total, page, limit) })
})

export const setProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) throw new ApiError(404, 'Product not found.')
  if (req.body.isAvailable != null) product.isAvailable = Boolean(req.body.isAvailable)
  await product.save()
  send(res, { product }, 'Product updated.')
})

export const categories = asyncHandler(async (req, res) => {
  const rows = await Category.find().sort({ name: 1 })
  send(res, { categories: rows })
})

export const createCategory = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim()
  if (name.length < 2) throw new ApiError(400, 'Enter a category name.')
  const category = await Category.create({ name, slug: slugify(name), description: req.body.description || '' })
  send(res, { category }, 'Category created.', 201)
})

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
  if (!category) throw new ApiError(404, 'Category not found.')
  if (req.body.name) {
    category.name = String(req.body.name).trim()
    category.slug = slugify(category.name)
  }
  if (req.body.description != null) category.description = req.body.description
  await category.save()
  send(res, { category }, 'Category updated.')
})

export const deleteCategory = asyncHandler(async (req, res) => {
  const inUse = await Product.countDocuments({ category: req.params.id })
  const shopUse = await Shop.countDocuments({ category: req.params.id })
  if (inUse || shopUse) throw new ApiError(400, 'This category is still in use.')
  const category = await Category.findByIdAndDelete(req.params.id)
  if (!category) throw new ApiError(404, 'Category not found.')
  send(res, { ok: true }, 'Category deleted.')
})

export const decidePartner = asyncHandler(async (req, res) => {
  const partner = await User.findOne({ _id: req.params.id, role: 'DELIVERY_PARTNER' })
  if (!partner) throw new ApiError(404, 'Delivery partner not found.')
  const action = req.body.action
  const note = String(req.body.note || '').trim().slice(0, 240)
  const next = {
    approve: 'APPROVED',
    reject: 'REJECTED',
    suspend: 'SUSPENDED',
    reactivate: 'APPROVED',
  }[action]
  if (!next) throw new ApiError(400, 'Choose approve, reject, suspend, or reactivate.', 'INVALID_ACTION')
  partner.partnerProfile = partner.partnerProfile || {}
  partner.partnerProfile.partnerStatus = next
  partner.partnerProfile.statusNote = note
  if (next !== 'APPROVED') {
    partner.isOnline = false
  }
  partner.markModified('partnerProfile')
  await partner.save()
  const titles = {
    APPROVED: ['Partner approved', 'You can go online and receive delivery offers.'],
    REJECTED: ['Partner application declined', note || 'This application was not approved.'],
    SUSPENDED: ['Partner suspended', note || 'You cannot accept deliveries until an admin reactivates the account.'],
  }
  const [title, message] = titles[next] || titles.APPROVED
  await notify(req.app.get('io'), {
    recipient: partner._id,
    type: `PARTNER_${next}`,
    title,
    message,
  })
  send(res, { partner }, `Partner ${next.toLowerCase()}.`)
})

export const partners = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query)
  const filter = { role: 'DELIVERY_PARTNER' }
  if (req.query.status) filter['partnerProfile.partnerStatus'] = req.query.status
  const rows = await User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
  const total = await User.countDocuments(filter)
  const stats = await Delivery.aggregate([
    { $match: { status: 'DELIVERED', deliveryPartner: { $ne: null } } },
    { $group: { _id: '$deliveryPartner', deliveries: { $sum: 1 }, earnings: { $sum: '$earnings' } } },
  ])
  const byId = new Map(stats.map((row) => [String(row._id), row]))
  send(res, {
    partners: rows.map((partner) => ({
      ...partner.toJSON(),
      deliveries: byId.get(String(partner._id))?.deliveries || 0,
      earnings: round2(byId.get(String(partner._id))?.earnings || 0),
    })),
    pagination: pageMeta(total, page, limit),
  })
})

export const reviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query)
  const [rows, total] = await Promise.all([
    Review.find().populate('customer', 'name').populate('shop', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Review.countDocuments(),
  ])
  send(res, { reviews: rows, pagination: pageMeta(total, page, limit) })
})

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id)
  if (!review) throw new ApiError(404, 'Review not found.')
  const remaining = await Review.find({ shop: review.shop })
  const reviewCount = remaining.length
  const rating = reviewCount ? Math.round((remaining.reduce((sum, item) => sum + item.rating, 0) / reviewCount) * 10) / 10 : 0
  await Shop.findByIdAndUpdate(review.shop, { rating, reviewCount })
  send(res, { ok: true }, 'Review removed.')
})

export const settings = asyncHandler(async (req, res) => {
  send(res, {
    taxRate: Number(process.env.TAX_RATE || 0),
    demoTracking: process.env.DEMO_TRACKING === 'true',
    paymentProvider: 'mock',
    currency: 'INR',
  })
})

export const reports = asyncHandler(async (req, res) => {
  const completed = ['DELIVERED', 'PICKED_UP', 'BILLED']
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - 6)
  const [gmvAgg, statusAgg, dayAgg, shopAgg, orderCount] = await Promise.all([
    Order.aggregate([
      { $match: { orderStatus: { $in: completed } } },
      { $group: { _id: null, gmv: { $sum: '$total' }, orders: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { orderStatus: { $in: completed }, createdAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: { orderStatus: { $in: completed } } },
      { $group: { _id: '$shop', revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'shops', localField: '_id', foreignField: '_id', as: 'shop' } },
      { $unwind: { path: '$shop', preserveNullAndEmptyArrays: true } },
    ]),
    Order.countDocuments(),
  ])
  send(res, {
    gmv: round2(gmvAgg[0]?.gmv || 0),
    orders: orderCount,
    byStatus: statusAgg.map((row) => ({ status: row._id, count: row.count })),
    revenueByDay: dayAgg.map((row) => ({
      date: new Date(row._id).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      revenue: round2(row.revenue),
      orders: row.orders,
    })),
    topShops: shopAgg.map((row) => ({
      shop: row.shop?.name || 'Shop',
      revenue: round2(row.revenue),
      orders: row.orders,
    })),
  })
})
