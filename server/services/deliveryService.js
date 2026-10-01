import Delivery from '../models/Delivery.js'
import Order from '../models/Order.js'
import Shop from '../models/Shop.js'
import User, { partnerStatusOf } from '../models/User.js'
import { ApiError } from '../utils/http.js'
import { haversineKm, point } from '../utils/geo.js'
import { round2 } from '../utils/money.js'
import { transitionOrder } from './orderService.js'
import { emitOrderUpdate, notify } from './notificationService.js'
async function beginDemo(io, deliveryId) {
  const { startDemoTracking } = await import('./demoTracking.js')
  startDemoTracking(io, deliveryId)
}

async function endDemo(deliveryId) {
  const { stopDemoTracking } = await import('./demoTracking.js')
  stopDemoTracking(deliveryId)
}

const lastLocationWrite = new Map()
export const OFFER_RADIUS_METERS = 8000

export function assertPartnerCanWork(user) {
  if (user.role !== 'DELIVERY_PARTNER') throw new ApiError(403, 'You do not have access to this action.', 'FORBIDDEN')
  const status = partnerStatusOf(user)
  if (status !== 'APPROVED') {
    throw new ApiError(403, 'Your partner account must be approved before you can take deliveries.', 'PARTNER_NOT_APPROVED')
  }
}

export async function assignDelivery(order, io) {
  if (order.fulfillmentMethod !== 'DELIVERY') {
    throw new ApiError(400, 'Pickup orders do not need a delivery partner.')
  }
  if (order.orderStatus !== 'READY') {
    throw new ApiError(400, 'Mark the order ready before assigning delivery.')
  }

  const shopForSearch = await Shop.findById(order.shop)
  if (!shopForSearch?.location?.coordinates) {
    throw new ApiError(400, 'This shop does not have a location.')
  }
  const partners = await User.find({
    role: 'DELIVERY_PARTNER',
    isOnline: true,
    isActive: true,
    'partnerProfile.partnerStatus': 'APPROVED',
    'partnerProfile.baseLocation': {
      $near: {
        $geometry: { type: 'Point', coordinates: shopForSearch.location.coordinates },
        $maxDistance: OFFER_RADIUS_METERS,
      },
    },
  }).select('_id')
  if (!partners.length) {
    throw new ApiError(400, 'No approved delivery partners are online near this shop.', 'NO_NEARBY_PARTNERS')
  }

  const shop = shopForSearch
  const dropoff = order.shippingAddress?.location?.coordinates || shop.location.coordinates
  let delivery = await Delivery.findOne({ order: order._id })
  if (delivery && ['ACCEPTED', 'PICKED_UP', 'DELIVERED'].includes(delivery.status)) {
    throw new ApiError(400, 'This order already has a delivery partner.')
  }

  if (!delivery) {
    delivery = await Delivery.create({
      order: order._id,
      status: 'OFFERED',
      pickupLocation: shop.location,
      dropoffLocation: point(dropoff[0], dropoff[1]),
      estimatedDeliveryTime: order.etaMax,
    })
    order.delivery = delivery._id
    await order.save()
  } else {
    delivery.status = 'OFFERED'
    delivery.deliveryPartner = null
    delivery.declinedBy = []
    delivery.pickupLocation = shop.location
    delivery.dropoffLocation = point(dropoff[0], dropoff[1])
    await delivery.save()
  }

  const distanceKm = haversineKm(shop.location.coordinates, dropoff)
  const eligible = partners.filter((partner) => !delivery.declinedBy.some((id) => String(id) === String(partner._id)))
  if (!eligible.length) {
    throw new ApiError(400, 'Nearby partners have already declined this delivery.', 'NO_NEARBY_PARTNERS')
  }

  io?.to('delivery:online').emit('delivery:offer', {
    deliveryId: delivery._id,
    orderId: order._id,
    orderNumber: order.orderNumber,
    shopName: shop.name,
    shopArea: shop.city,
    destinationArea: order.shippingAddress?.area,
    distanceKm: round2(distanceKm),
    earningsEstimate: round2(Math.max(25, (order.deliveryFee || 0) * 0.7)),
    deliveryType: 'Local delivery',
  })

  for (const partner of eligible) {
    await notify(io, {
      recipient: partner._id,
      type: 'DELIVERY_OFFER',
      title: 'Delivery nearby',
      message: `${shop.name} in ${shop.city} → ${order.shippingAddress?.area || 'nearby'}, about ${round2(distanceKm)} km.`,
      order: order._id,
    })
  }

  return delivery
}

export async function acceptDelivery(deliveryId, user, io) {
  assertPartnerCanWork(user)
  if (!user.isOnline) throw new ApiError(400, 'Go online before accepting a delivery.', 'PARTNER_OFFLINE')
  const fresh = await User.findById(user._id).select('partnerProfile.baseLocation')
  const base = fresh?.partnerProfile?.baseLocation?.coordinates
  const preview = await Delivery.findById(deliveryId).populate({ path: 'order', populate: { path: 'shop', select: 'location' } })
  const shopPoint = preview?.order?.shop?.location?.coordinates
  if (base?.length === 2 && shopPoint?.length === 2) {
    const km = haversineKm(base, shopPoint)
    if (km * 1000 > OFFER_RADIUS_METERS) {
      throw new ApiError(403, 'This delivery is outside your area.', 'OUTSIDE_AREA')
    }
  }

  const busy = await Delivery.findOne({
    deliveryPartner: user._id,
    status: { $in: ['ACCEPTED', 'PICKED_UP'] },
  })
  if (busy) throw new ApiError(400, 'Finish your active delivery first.')

  const delivery = await Delivery.findOneAndUpdate(
    { _id: deliveryId, status: 'OFFERED', deliveryPartner: null, declinedBy: { $ne: user._id } },
    { deliveryPartner: user._id, status: 'ACCEPTED', acceptedAt: new Date(), demoProgress: 0 },
    { new: true }
  )
  if (!delivery) throw new ApiError(409, 'This delivery is no longer available.')

  const order = await Order.findById(delivery.order)
  const shop = await Shop.findById(order.shop)
  delivery.currentLocation = {
    type: 'Point',
    coordinates: shop.location.coordinates,
  }
  delivery.locationUpdatedAt = new Date()
  await delivery.save()

  io?.to('delivery:online').emit('delivery:offer:taken', { deliveryId: delivery._id, orderId: order._id })
  await notify(io, {
    recipient: order.customer,
    type: 'DELIVERY_ACCEPTED',
    title: 'Partner assigned',
    message: `A delivery partner is heading to the shop for ${order.orderNumber}.`,
    order: order._id,
  })
  emitOrderUpdate(io, order, { deliveryStatus: 'ACCEPTED' })
  await beginDemo(io, delivery._id)
  return delivery
}

export async function declineDelivery(deliveryId, user, io) {
  const delivery = await Delivery.findOne({ _id: deliveryId, status: 'OFFERED' })
  if (!delivery) throw new ApiError(404, 'That delivery offer is no longer open.')
  if (!delivery.declinedBy.some((id) => String(id) === String(user._id))) {
    delivery.declinedBy.push(user._id)
    await delivery.save()
  }
  io?.to(`user:${user._id}`).emit('delivery:offer:taken', { deliveryId: delivery._id, declined: true })
  return delivery
}

export async function markPickedUp(deliveryId, user, io) {
  const delivery = await Delivery.findById(deliveryId)
  if (!delivery || String(delivery.deliveryPartner) !== String(user._id)) {
    throw new ApiError(403, 'You are not assigned to this delivery.')
  }
  if (delivery.status !== 'ACCEPTED') throw new ApiError(400, 'Accept the delivery before pickup.')

  const order = await Order.findById(delivery.order)
  await transitionOrder({
    order,
    to: 'OUT_FOR_DELIVERY',
    actor: user,
    note: 'Picked up from the shop',
    io,
  })
  delivery.status = 'PICKED_UP'
  delivery.pickedUpAt = new Date()
  delivery.demoProgress = 0
  const shop = await Shop.findById(order.shop)
  delivery.currentLocation = { type: 'Point', coordinates: shop.location.coordinates }
  delivery.locationUpdatedAt = new Date()
  await delivery.save()
  await beginDemo(io, delivery._id)
  return delivery
}

export async function markDelivered(deliveryId, user, io) {
  const delivery = await Delivery.findById(deliveryId)
  if (!delivery || String(delivery.deliveryPartner) !== String(user._id)) {
    throw new ApiError(403, 'You are not assigned to this delivery.')
  }
  if (delivery.status !== 'PICKED_UP') throw new ApiError(400, 'Pick up the order before completing delivery.')

  const order = await Order.findById(delivery.order)
  const earnings = round2(Math.max(25, order.deliveryFee * 0.7))
  await transitionOrder({
    order,
    to: 'DELIVERED',
    actor: user,
    note: 'Delivered to the customer',
    io,
  })
  delivery.status = 'DELIVERED'
  delivery.deliveredAt = new Date()
  delivery.earnings = earnings
  const dropoff = delivery.dropoffLocation?.coordinates
  if (dropoff?.length === 2) {
    delivery.currentLocation = { type: 'Point', coordinates: dropoff }
    delivery.locationUpdatedAt = new Date()
  }
  await delivery.save()
  await endDemo(delivery._id)
  return delivery
}

export async function updateDeliveryLocation({ deliveryId, user, longitude, latitude, source, io }) {
  const delivery = await Delivery.findById(deliveryId)
  if (!delivery) throw new ApiError(404, 'Delivery not found.')

  const isAssigned = user && String(delivery.deliveryPartner) === String(user._id)
  const isDemo = source === 'demo' && process.env.DEMO_TRACKING === 'true'
  if (!isAssigned && !isDemo) throw new ApiError(403, 'You cannot update this delivery.')
  if (!['ACCEPTED', 'PICKED_UP'].includes(delivery.status)) {
    throw new ApiError(400, 'This delivery is not active.')
  }

  const lng = Number(longitude)
  const lat = Number(latitude)
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) throw new ApiError(400, 'That location is not valid.')

  if (!isDemo) {
    const key = String(delivery._id)
    const now = Date.now()
    const previous = lastLocationWrite.get(key) || 0
    if (now - previous < 5000) return delivery
    lastLocationWrite.set(key, now)
  }

  delivery.currentLocation = { type: 'Point', coordinates: [lng, lat] }
  delivery.locationUpdatedAt = new Date()
  await delivery.save()

  const order = await Order.findById(delivery.order).populate('shop', 'location name')
  const target = delivery.status === 'PICKED_UP'
    ? delivery.dropoffLocation?.coordinates
    : order.shop?.location?.coordinates
  const remainingKm = target ? round2(haversineKm([lng, lat], target)) : null

  io?.to(`order:${order._id}`).emit('delivery:location', {
    orderId: order._id,
    deliveryId: delivery._id,
    coordinates: [lng, lat],
    updatedAt: delivery.locationUpdatedAt,
    remainingKm,
    demo: Boolean(isDemo),
  })

  return delivery
}

export async function canViewDelivery(user, order, delivery) {
  if (!user) return false
  if (user.role === 'ADMIN') return true
  if (String(order.customer?._id || order.customer) === String(user._id)) return true
  if (delivery && String(delivery.deliveryPartner) === String(user._id)) return true
  if (user.role === 'SHOP_OWNER') {
    const shop = await Shop.findById(order.shop?._id || order.shop).select('owner')
    return shop && String(shop.owner) === String(user._id)
  }
  return false
}
