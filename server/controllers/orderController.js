import Order from '../models/Order.js'
import Delivery from '../models/Delivery.js'
import Shop from '../models/Shop.js'
import { ApiError, asyncHandler, send } from '../utils/http.js'
import { buildQuote, placeOrder, transitionOrder } from '../services/orderService.js'
import { canViewDelivery } from '../services/deliveryService.js'
import { flowFor } from '../utils/orderMachine.js'
import { pageMeta, pageParams } from '../utils/pagination.js'
import { haversineKm } from '../utils/geo.js'
import { round2 } from '../utils/money.js'

function presentOrder(order) {
  const plain = order.toObject ? order.toObject() : order
  if (plain.fulfillmentMethod !== 'PICKUP') delete plain.pickupCode
  return plain
}

export const quote = asyncHandler(async (req, res) => {
  const data = await buildQuote(req.user, req.body)
  send(res, { quote: data })
})

export const createOrder = asyncHandler(async (req, res) => {
  if (!['DELIVERY', 'PICKUP'].includes(req.body.fulfillmentMethod)) {
    throw new ApiError(400, 'Choose delivery or pickup.')
  }
  if (!['UPI', 'CARD', 'COD'].includes(req.body.paymentMethod)) {
    throw new ApiError(400, 'Choose UPI, card, or cash on delivery.')
  }
  const order = await placeOrder(req.user, req.body, req.app.get('io'))
  const payload = order.toObject()
  delete payload.pickupCode
  send(res, { order: payload }, 'Order placed.', 201)
})

export const listOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query)
  const filter = { customer: req.user._id }
  const [orders, total] = await Promise.all([
    Order.find(filter).populate('shop', 'name logo address city area rating').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ])
  send(res, {
    pagination: pageMeta(total, page, limit),
    orders: orders.map((order) => {
      const plain = order.toObject()
      if (plain.orderStatus !== 'READY' || plain.fulfillmentMethod !== 'PICKUP') delete plain.pickupCode
      return plain
    }),
  })
})

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('shop', 'name logo address city location phone openingTime closingTime')
  if (!order) throw new ApiError(404, 'Order not found.')
  const allowed = await canViewDelivery(req.user, order, null)
  const isCustomer = String(order.customer) === String(req.user._id)
  if (!allowed && !isCustomer) throw new ApiError(403, 'You do not have access to this action.')
  const plain = order.toObject()
  const showCode = isCustomer && plain.fulfillmentMethod === 'PICKUP' && ['READY', 'PICKED_UP'].includes(plain.orderStatus)
  if (!showCode) delete plain.pickupCode
  send(res, { order: plain })
})

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order || String(order.customer) !== String(req.user._id)) throw new ApiError(404, 'Order not found.')
  const updated = await transitionOrder({
    order,
    to: 'CANCELLED',
    actor: req.user,
    note: 'Cancelled by customer',
    io: req.app.get('io'),
  })
  send(res, { order: presentOrder(updated) }, 'Order cancelled.')
})

export const trackOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('shop', 'name address city location phone')
  if (!order) throw new ApiError(404, 'Order not found.')
  const delivery = order.delivery ? await Delivery.findById(order.delivery) : null
  const allowed = await canViewDelivery(req.user, order, delivery)
  if (!allowed) throw new ApiError(403, 'You do not have access to this action.')

  const showLive = delivery && ['ACCEPTED', 'PICKED_UP', 'DELIVERED'].includes(delivery.status)
  const partnerLocation = showLive && delivery.currentLocation?.coordinates?.length === 2
    ? {
        coordinates: delivery.currentLocation.coordinates,
        updatedAt: delivery.locationUpdatedAt,
        demo: process.env.DEMO_TRACKING === 'true' && ['ACCEPTED', 'PICKED_UP'].includes(delivery.status),
      }
    : null

  let remainingKm = null
  if (partnerLocation && order.fulfillmentMethod === 'DELIVERY') {
    const target = delivery.status === 'PICKED_UP' || order.orderStatus === 'OUT_FOR_DELIVERY'
      ? delivery.dropoffLocation?.coordinates
      : order.shop.location.coordinates
    if (target) remainingKm = round2(haversineKm(partnerLocation.coordinates, target))
  }

  const plain = order.toObject()
  const showCode = String(order.customer) === String(req.user._id)
    && plain.fulfillmentMethod === 'PICKUP'
    && ['READY', 'PICKED_UP'].includes(plain.orderStatus)
  if (!showCode) delete plain.pickupCode

  send(res, {
    order: plain,
    steps: flowFor(order.fulfillmentMethod),
    delivery: delivery
      ? {
          _id: delivery._id,
          status: delivery.status,
          partnerLocation,
          pickupLocation: delivery.pickupLocation,
          dropoffLocation: delivery.dropoffLocation,
          estimatedDeliveryTime: delivery.estimatedDeliveryTime,
          remainingKm,
        }
      : null,
    demoTracking: process.env.DEMO_TRACKING === 'true',
  })
})

export { presentOrder }
