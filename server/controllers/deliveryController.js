import Delivery from '../models/Delivery.js'
import Order from '../models/Order.js'
import Shop from '../models/Shop.js'
import User, { partnerStatusOf } from '../models/User.js'
import { ApiError, asyncHandler, send } from '../utils/http.js'
import { haversineKm } from '../utils/geo.js'
import { round2 } from '../utils/money.js'
import {
  acceptDelivery,
  assertPartnerCanWork,
  declineDelivery,
  markDelivered,
  markPickedUp,
  OFFER_RADIUS_METERS,
  updateDeliveryLocation,
} from '../services/deliveryService.js'

function shapeOffer(delivery, order, shop, { revealAddress }) {
  const dropoff = delivery.dropoffLocation?.coordinates || order.shippingAddress?.location?.coordinates
  const distanceKm = dropoff ? round2(haversineKm(shop.location.coordinates, dropoff)) : null
  const offer = {
    deliveryId: delivery._id,
    orderId: order._id,
    orderNumber: order.orderNumber,
    shopName: shop.name,
    shopArea: shop.city,
    destinationArea: order.shippingAddress?.area || shop.city,
    customerArea: order.shippingAddress?.area,
    distanceKm,
    status: delivery.status,
    earningsEstimate: round2(Math.max(25, (order.deliveryFee || 0) * 0.7)),
    deliveryType: 'Local delivery',
  }
  if (revealAddress) {
    offer.shopAddress = `${shop.address}, ${shop.city}`
    offer.customerAddress = order.shippingAddress
    offer.pickup = shop.location
    offer.dropoff = delivery.dropoffLocation
  }
  return offer
}

function withinOfferRadius(user, shop) {
  const base = user.partnerProfile?.baseLocation?.coordinates
  const shopPoint = shop?.location?.coordinates
  if (!base || base.length !== 2 || !shopPoint || shopPoint.length !== 2) return false
  return haversineKm(base, shopPoint) * 1000 <= OFFER_RADIUS_METERS
}

export const setOnline = asyncHandler(async (req, res) => {
  const isOnline = Boolean(req.body.isOnline)
  if (isOnline) assertPartnerCanWork(req.user)
  await User.findByIdAndUpdate(req.user._id, { isOnline })
  req.user.isOnline = isOnline
  const io = req.app.get('io')
  io?.to(`user:${req.user._id}`).emit('delivery:presence', { isOnline })
  send(res, { isOnline })
})

export const listOffers = asyncHandler(async (req, res) => {
  const active = await Delivery.findOne({
    deliveryPartner: req.user._id,
    status: { $in: ['ACCEPTED', 'PICKED_UP'] },
  }).populate({ path: 'order', populate: { path: 'shop', select: 'name address city location' } })

  const offers = req.user.isOnline && partnerStatusOf(req.user) === 'APPROVED'
    ? await Delivery.find({
      status: 'OFFERED',
      declinedBy: { $ne: req.user._id },
    }).populate({ path: 'order', populate: { path: 'shop' } })
    : []

  send(res, {
    isOnline: req.user.isOnline,
    partnerStatus: partnerStatusOf(req.user),
    active: active?.order ? shapeOffer(active, active.order, active.order.shop, { revealAddress: true }) : null,
    offers: offers
      .filter((delivery) => delivery.order?.shop && withinOfferRadius(req.user, delivery.order.shop))
      .map((delivery) => shapeOffer(delivery, delivery.order, delivery.order.shop, { revealAddress: false })),
  })
})

export const getActive = asyncHandler(async (req, res) => {
  const delivery = await Delivery.findOne({
    deliveryPartner: req.user._id,
    status: { $in: ['ACCEPTED', 'PICKED_UP'] },
  })
  if (!delivery) {
    send(res, { delivery: null })
    return
  }
  const order = await Order.findById(delivery.order).populate('shop', 'name address city location phone')
  send(res, { delivery: { ...shapeOffer(delivery, order, order.shop, { revealAddress: true }), status: delivery.status, orderStatus: order.orderStatus } })
})

export const accept = asyncHandler(async (req, res) => {
  const delivery = await acceptDelivery(req.params.id, req.user, req.app.get('io'))
  send(res, { delivery }, 'Delivery accepted.')
})

export const decline = asyncHandler(async (req, res) => {
  await declineDelivery(req.params.id, req.user, req.app.get('io'))
  send(res, { ok: true }, 'Delivery declined.')
})

export const pickup = asyncHandler(async (req, res) => {
  const delivery = await markPickedUp(req.params.id, req.user, req.app.get('io'))
  send(res, { delivery }, 'Marked as picked up.')
})

export const complete = asyncHandler(async (req, res) => {
  const delivery = await markDelivered(req.params.id, req.user, req.app.get('io'))
  send(res, { delivery }, 'Delivery completed.')
})

export const location = asyncHandler(async (req, res) => {
  const delivery = await updateDeliveryLocation({
    deliveryId: req.params.id,
    user: req.user,
    longitude: req.body.longitude,
    latitude: req.body.latitude,
    io: req.app.get('io'),
  })
  send(res, { location: delivery.currentLocation, updatedAt: delivery.locationUpdatedAt })
})

export const history = asyncHandler(async (req, res) => {
  const rows = await Delivery.find({ deliveryPartner: req.user._id, status: 'DELIVERED' })
    .populate({ path: 'order', select: 'orderNumber total shippingAddress shop', populate: { path: 'shop', select: 'name' } })
    .sort({ deliveredAt: -1 })
    .limit(50)
  send(res, { deliveries: rows })
})

export const earnings = asyncHandler(async (req, res) => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const week = new Date(start)
  week.setDate(week.getDate() - 6)
  const [summary, todayRows] = await Promise.all([
    Delivery.aggregate([
      { $match: { deliveryPartner: req.user._id, status: 'DELIVERED' } },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$earnings' },
          completed: { $sum: 1 },
          todayEarnings: { $sum: { $cond: [{ $gte: ['$deliveredAt', start] }, '$earnings', 0] } },
          todayDeliveries: { $sum: { $cond: [{ $gte: ['$deliveredAt', start] }, 1, 0] } },
          weekEarnings: { $sum: { $cond: [{ $gte: ['$deliveredAt', week] }, '$earnings', 0] } },
        },
      },
    ]),
    Delivery.find({ deliveryPartner: req.user._id, status: 'DELIVERED', deliveredAt: { $gte: start } })
      .sort({ deliveredAt: -1 })
      .limit(20),
  ])
  const row = summary[0] || {}
  send(res, {
    todayEarnings: round2(row.todayEarnings || 0),
    todayDeliveries: row.todayDeliveries || 0,
    weekEarnings: round2(row.weekEarnings || 0),
    totalEarnings: round2(row.totalEarnings || 0),
    completed: row.completed || 0,
    history: todayRows,
  })
})

export const dashboard = asyncHandler(async (req, res) => {
  const partner = await User.findById(req.user._id)
  const active = await Delivery.findOne({
    deliveryPartner: req.user._id,
    status: { $in: ['ACCEPTED', 'PICKED_UP'] },
  }).populate({ path: 'order', populate: { path: 'shop', select: 'name address city location' } })
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const week = new Date(start)
  week.setDate(week.getDate() - 6)
  const [doneToday, doneWeek, totals] = await Promise.all([
    Delivery.aggregate([
      { $match: { deliveryPartner: req.user._id, status: 'DELIVERED', deliveredAt: { $gte: start } } },
      { $group: { _id: null, count: { $sum: 1 }, earnings: { $sum: '$earnings' } } },
    ]),
    Delivery.aggregate([
      { $match: { deliveryPartner: req.user._id, status: 'DELIVERED', deliveredAt: { $gte: week } } },
      { $group: { _id: null, count: { $sum: 1 }, earnings: { $sum: '$earnings' } } },
    ]),
    Delivery.aggregate([
      { $match: { deliveryPartner: req.user._id, status: 'DELIVERED' } },
      { $group: { _id: null, count: { $sum: 1 }, earnings: { $sum: '$earnings' } } },
    ]),
  ])
  const openOffers = partnerStatusOf(partner) === 'APPROVED' && partner.isOnline
    ? await Delivery.find({ status: 'OFFERED', declinedBy: { $ne: req.user._id } }).populate({ path: 'order', populate: { path: 'shop', select: 'location city' } })
    : []
  send(res, {
    isOnline: partner.isOnline,
    partnerStatus: partnerStatusOf(partner),
    statusNote: partner.partnerProfile?.statusNote || '',
    payoutLabel: partner.partnerProfile?.payoutLabel || 'Demo payout profile',
    active: active?.order?.shop ? shapeOffer(active, active.order, active.order.shop, { revealAddress: true }) : null,
    todayDeliveries: doneToday[0]?.count || 0,
    todayEarnings: round2(doneToday[0]?.earnings || 0),
    weekEarnings: round2(doneWeek[0]?.earnings || 0),
    totalEarnings: round2(totals[0]?.earnings || 0),
    openOffers: openOffers.filter((row) => row.order?.shop && withinOfferRadius(partner, row.order.shop)).length,
  })
})
