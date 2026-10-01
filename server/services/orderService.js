import Cart from '../models/Cart.js'
import Product from '../models/Product.js'
import Shop from '../models/Shop.js'
import Address from '../models/Address.js'
import Order from '../models/Order.js'
import Delivery from '../models/Delivery.js'
import Counter from '../models/Counter.js'
import { ApiError } from '../utils/http.js'
import { haversineKm, point } from '../utils/geo.js'
import { etaRange, quoteTotals, round2, unitPrice } from '../utils/money.js'
import { isShopOpen } from '../utils/hours.js'
import { canTransition, isTerminal } from '../utils/orderMachine.js'
import { reserveStock, restoreStock, withOptionalTransaction } from './inventoryService.js'
import { confirmPayment, createPaymentIntent } from './paymentService.js'
import { emitOrderUpdate, notify } from './notificationService.js'

async function loadCartLines(userId) {
  const cart = await Cart.findOne({ customer: userId })
  if (!cart || !cart.items.length || !cart.shop) {
    throw new ApiError(400, 'Your cart is empty.')
  }
  const shop = await Shop.findById(cart.shop).populate('owner', 'name')
  if (!shop || shop.approvalStatus !== 'APPROVED') {
    throw new ApiError(400, 'This shop is not accepting orders.')
  }
  if (!isShopOpen(shop)) {
    throw new ApiError(400, 'This shop is closed right now.')
  }

  const products = await Product.find({ _id: { $in: cart.items.map((item) => item.product) }, shop: shop._id })
  const byId = new Map(products.map((product) => [String(product._id), product]))
  const lines = cart.items.map((item) => {
    const product = byId.get(String(item.product))
    if (!product || !product.isAvailable) {
      throw new ApiError(400, 'A product in your cart is no longer available.')
    }
    return {
      product: product._id,
      name: product.name,
      price: unitPrice(product),
      quantity: item.quantity,
      unit: product.unit,
      image: product.images?.[0] || '',
    }
  })
  return { cart, shop, lines }
}

function addressSnapshot(address) {
  return {
    fullName: address.fullName,
    phone: address.phone,
    flat: address.flat,
    building: address.building,
    area: address.area,
    city: address.city,
    state: address.state,
    pinCode: address.pinCode,
    landmark: address.landmark,
    location: address.location?.coordinates?.length === 2 ? address.location : null,
  }
}

async function resolveDestination(user, shop, { fulfillmentMethod, addressId, coordinates }) {
  if (fulfillmentMethod === 'PICKUP') {
    if (!shop.pickupAvailable) throw new ApiError(400, 'This shop does not offer pickup.')
    return {
      distanceKm: 0,
      shippingAddress: {
        fullName: user.name,
        phone: user.phone,
        flat: shop.address,
        building: '',
        area: shop.city,
        city: shop.city,
        state: shop.state,
        pinCode: shop.pinCode,
        landmark: 'Pickup at the shop',
        location: shop.location,
      },
      dropoff: shop.location.coordinates,
    }
  }

  if (!shop.deliveryAvailable) throw new ApiError(400, 'This shop does not offer delivery.')
  const address = await Address.findOne({ _id: addressId, customer: user._id })
  if (!address) throw new ApiError(400, 'Choose a delivery address.')

  let dropoff = address.location?.coordinates
  if ((!dropoff || dropoff.length !== 2) && Array.isArray(coordinates) && coordinates.length === 2) {
    dropoff = coordinates.map(Number)
  }
  if (!dropoff || dropoff.length !== 2) {
    throw new ApiError(400, 'Add a map location to this address before delivery.')
  }

  const distanceKm = haversineKm(shop.location.coordinates, dropoff)
  if (distanceKm > shop.deliveryRadius) {
    throw new ApiError(400, 'This address is outside the shop’s delivery area.')
  }
  return { distanceKm, shippingAddress: addressSnapshot({ ...address.toObject(), location: point(dropoff[0], dropoff[1]) }), dropoff }
}

export async function buildQuote(user, body) {
  const { shop, lines } = await loadCartLines(user._id)
  const destination = await resolveDestination(user, shop, body)
  const subtotal = round2(lines.reduce((sum, line) => sum + line.price * line.quantity, 0))
  const totals = quoteTotals({
    subtotal,
    distanceKm: destination.distanceKm,
    fulfillment: body.fulfillmentMethod,
  })
  const eta = etaRange(shop, destination.distanceKm, body.fulfillmentMethod)
  return {
    shop: { _id: shop._id, name: shop.name, address: shop.address, city: shop.city },
    lines,
    ...totals,
    eta,
    fulfillmentMethod: body.fulfillmentMethod,
    shippingAddress: destination.shippingAddress,
  }
}

export async function placeOrder(user, body, io) {
  const quote = await buildQuote(user, body)
  const shop = await Shop.findById(quote.shop._id)
  await createPaymentIntent({
    method: body.paymentMethod,
    amount: quote.total,
    orderNumber: 'pending',
  })

  const orderNumber = await Counter.nextOrderNumber()
  const payment = await confirmPayment({ method: body.paymentMethod, orderNumber })

  const order = await withOptionalTransaction(async (session) => {
    await reserveStock(quote.lines, { session })
    try {
      const [created] = await Order.create([{
        orderNumber,
        customer: user._id,
        shop: shop._id,
        items: quote.lines,
        subtotal: quote.subtotal,
        deliveryFee: quote.deliveryFee,
        tax: quote.tax,
        discount: quote.discount,
        total: quote.total,
        fulfillmentMethod: body.fulfillmentMethod,
        shippingAddress: quote.shippingAddress,
        paymentMethod: body.paymentMethod,
        paymentStatus: payment.status,
        paymentProvider: payment.provider,
        paymentReference: payment.reference,
        paymentNote: payment.note,
        orderStatus: 'PLACED',
        pickupCode: body.fulfillmentMethod === 'PICKUP' ? String(Math.floor(1000 + Math.random() * 9000)) : '',
        notes: body.notes || '',
        distanceKm: quote.distanceKm,
        etaMin: quote.eta.min,
        etaMax: quote.eta.max,
        statusHistory: [{ status: 'PLACED', note: 'Order placed' }],
      }], { session })
      await Cart.findOneAndUpdate({ customer: user._id }, { items: [], shop: null }, { session })
      return created
    } catch (error) {
      if (!session) await restoreStock(quote.lines, { reason: 'Order creation failed' })
      throw error
    }
  })

  await notify(io, {
    recipient: shop.owner,
    type: 'NEW_ORDER',
    title: 'New order',
    message: `${orderNumber} is waiting for acceptance.`,
    order: order._id,
  })
  emitOrderUpdate(io, { ...order.toObject(), shop }, {})
  return Order.findById(order._id).populate('shop', 'name address city location logo rating')
}

export async function transitionOrder({ order, to, actor, note, io, pickupCode }) {
  if (isTerminal(order.orderStatus)) {
    throw new ApiError(400, 'This order is already finished.')
  }
  if (!canTransition(order.fulfillmentMethod, order.orderStatus, to)) {
    throw new ApiError(400, 'This order cannot move to that status.', 'INVALID_TRANSITION')
  }

  if (to === 'CANCELLED' && actor.role === 'CUSTOMER') {
    if (!['PLACED', 'ACCEPTED'].includes(order.orderStatus)) {
      throw new ApiError(400, 'This order can no longer be cancelled.', 'INVALID_TRANSITION')
    }
    if (String(order.customer) !== String(actor._id) && String(order.customer?._id) !== String(actor._id)) {
      throw new ApiError(403, 'You do not have access to this action.')
    }
  }

  if (to === 'REJECTED' && order.orderStatus !== 'PLACED') {
    throw new ApiError(400, 'Only new orders can be rejected.')
  }

  if (to === 'PICKED_UP') {
    if (!pickupCode || pickupCode !== order.pickupCode) {
      throw new ApiError(400, 'The pickup code does not match.')
    }
  }

  if (to === 'CANCELLED' || to === 'REJECTED') {
    await restoreStock(order.items, { orderId: order._id, reason: to === 'REJECTED' ? 'Order rejected' : 'Order cancelled' })
    if (order.delivery) {
      await Delivery.findByIdAndUpdate(order.delivery, { status: 'CANCELLED' })
    }
  }

  if ((to === 'DELIVERED' || to === 'PICKED_UP') && order.paymentMethod === 'COD') {
    order.paymentStatus = 'PAID'
    order.paymentNote = 'Cash collected. Recorded in NEARE as a simulated payment.'
  }

  order.orderStatus = to
  order.statusHistory.push({ status: to, note: note || '' })
  await order.save()

  const shop = await Shop.findById(order.shop)
  const titles = {
    ACCEPTED: ['Order accepted', `${order.orderNumber} was accepted by the shop.`],
    PREPARING: ['Preparing your order', `${order.orderNumber} is being prepared.`],
    READY: ['Order ready', order.fulfillmentMethod === 'PICKUP' ? `${order.orderNumber} is ready for pickup.` : `${order.orderNumber} is ready for delivery.`],
    OUT_FOR_DELIVERY: ['On the way', `${order.orderNumber} is out for delivery.`],
    DELIVERED: ['Delivered', `${order.orderNumber} was delivered.`],
    PICKED_UP: ['Picked up', `${order.orderNumber} was picked up.`],
    CANCELLED: ['Order cancelled', `${order.orderNumber} was cancelled.`],
    REJECTED: ['Order rejected', `${order.orderNumber} was rejected by the shop.`],
  }
  const [title, message] = titles[to] || ['Order update', `${order.orderNumber} is now ${to}.`]
  const recipient = actor.role === 'CUSTOMER' ? shop.owner : order.customer
  await notify(io, { recipient, type: to, title, message, order: order._id })
  if (to === 'CANCELLED' && order.delivery) {
    const delivery = await Delivery.findById(order.delivery)
    if (delivery?.deliveryPartner) {
      await notify(io, {
        recipient: delivery.deliveryPartner,
        type: 'DELIVERY_CANCELLED',
        title: 'Delivery cancelled',
        message: `${order.orderNumber} was cancelled.`,
        order: order._id,
      })
    }
  }
  emitOrderUpdate(io, { ...order.toObject(), shop })
  return order
}
