import Review from '../models/Review.js'
import Order from '../models/Order.js'
import Shop from '../models/Shop.js'
import { ApiError, asyncHandler, send } from '../utils/http.js'
import { isCompleted } from '../utils/orderMachine.js'

async function refreshShopRating(shopId) {
  const reviews = await Review.find({ shop: shopId })
  const reviewCount = reviews.length
  const rating = reviewCount
    ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount) * 10) / 10
    : 0
  await Shop.findByIdAndUpdate(shopId, { rating, reviewCount })
}

export const createReview = asyncHandler(async (req, res) => {
  const rating = Number(req.body.rating)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ApiError(400, 'Choose a rating from 1 to 5.')
  }
  const order = await Order.findById(req.body.orderId)
  if (!order || String(order.customer) !== String(req.user._id)) throw new ApiError(404, 'Order not found.')
  if (!isCompleted(order.orderStatus)) throw new ApiError(400, 'You can review an order after it is completed.')
  const existing = await Review.findOne({ order: order._id })
  if (existing) throw new ApiError(409, 'You have already reviewed this order.')

  const review = await Review.create({
    customer: req.user._id,
    shop: order.shop,
    order: order._id,
    rating,
    comment: String(req.body.comment || '').trim(),
  })
  await refreshShopRating(order.shop)
  send(res, { review }, 'Review saved.', 201)
})

export const myReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ customer: req.user._id }).populate('shop', 'name').sort({ createdAt: -1 })
  send(res, { reviews })
})
