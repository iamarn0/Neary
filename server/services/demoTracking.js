import Delivery from '../models/Delivery.js'
import Order from '../models/Order.js'
import Shop from '../models/Shop.js'
import { interpolate } from '../utils/geo.js'
import { updateDeliveryLocation } from './deliveryService.js'

const timers = new Map()

export function stopDemoTracking(deliveryId) {
  const timer = timers.get(String(deliveryId))
  if (timer) {
    clearInterval(timer)
    timers.delete(String(deliveryId))
  }
}

export function startDemoTracking(io, deliveryId) {
  if (process.env.DEMO_TRACKING !== 'true') return
  const key = String(deliveryId)
  if (timers.has(key)) return

  const timer = setInterval(async () => {
    try {
      const delivery = await Delivery.findById(deliveryId)
      if (!delivery || !['ACCEPTED', 'PICKED_UP'].includes(delivery.status)) {
        stopDemoTracking(deliveryId)
        return
      }
      const order = await Order.findById(delivery.order)
      const shop = await Shop.findById(order.shop)
      const shopPoint = shop.location.coordinates
      const dropoff = delivery.dropoffLocation?.coordinates || order.shippingAddress?.location?.coordinates
      if (!dropoff) return

      const from = delivery.status === 'ACCEPTED' ? offsetToward(dropoff, shopPoint, 0.35) : shopPoint
      const to = delivery.status === 'ACCEPTED' ? shopPoint : dropoff
      const progress = Math.min(1, (delivery.demoProgress || 0) + 0.08)
      delivery.demoProgress = progress
      await delivery.save()
      const [lng, lat] = interpolate(from, to, progress)
      await updateDeliveryLocation({
        deliveryId: delivery._id,
        longitude: lng,
        latitude: lat,
        source: 'demo',
        io,
      })
      if (progress >= 1) stopDemoTracking(deliveryId)
    } catch (error) {
      console.error('Demo tracking stopped', error.message)
      stopDemoTracking(deliveryId)
    }
  }, 5000)

  timers.set(key, timer)
}

function offsetToward(from, to, amount) {
  return interpolate(to, from, amount)
}

export async function resumeDemoTracking(io) {
  if (process.env.DEMO_TRACKING !== 'true') return
  const active = await Delivery.find({ status: { $in: ['ACCEPTED', 'PICKED_UP'] } }).select('_id')
  active.forEach((delivery) => startDemoTracking(io, delivery._id))
}
