import Notification from '../models/Notification.js'

export async function notify(io, { recipient, type, title, message, order }) {
  if (!recipient) return null
  const doc = await Notification.create({
    recipient,
    type,
    title,
    message,
    order: order || null,
  })
  io?.to(`user:${recipient}`).emit('notification:new', { notification: doc })
  return doc
}

export function emitOrderUpdate(io, order, extra = {}) {
  if (!io || !order) return
  const payload = {
    orderId: order._id,
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    ...extra,
  }
  io.to(`order:${order._id}`).emit('order:status', payload)
  io.to(`user:${order.customer}`).emit('order:status', payload)
  if (order.shop?.owner) {
    io.to(`user:${order.shop.owner}`).emit('order:status', payload)
  }
}
