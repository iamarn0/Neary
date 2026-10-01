import { Server } from 'socket.io'
import { clientOrigin } from '../config/clientOrigin.js'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Order from '../models/Order.js'
import Delivery from '../models/Delivery.js'
import { canViewDelivery, updateDeliveryLocation } from '../services/deliveryService.js'

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: clientOrigin(), credentials: true },
  })

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      if (!token) return next(new Error('Unauthorized'))
      const payload = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(payload.id)
      if (!user || !user.isActive) return next(new Error('Unauthorized'))
      socket.user = user
      next()
    } catch {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', (socket) => {
    socket.join(`user:${socket.user._id}`)
    if (socket.user.role === 'DELIVERY_PARTNER' && socket.user.isOnline) {
      socket.join('delivery:online')
    }

    socket.on('delivery:presence', (isOnline) => {
      if (socket.user.role !== 'DELIVERY_PARTNER') return
      if (isOnline) socket.join('delivery:online')
      else socket.leave('delivery:online')
    })

    socket.on('order:join', async (orderId) => {
      try {
        const order = await Order.findById(orderId)
        if (!order) return
        const delivery = order.delivery ? await Delivery.findById(order.delivery) : null
        const allowed = await canViewDelivery(socket.user, order, delivery)
        if (!allowed) return
        socket.join(`order:${order._id}`)
      } catch {
        /* Unauthorized joins are ignored. */
      }
    })

    socket.on('delivery:location', async (payload = {}) => {
      try {
        await updateDeliveryLocation({
          deliveryId: payload.deliveryId,
          user: socket.user,
          longitude: payload.longitude,
          latitude: payload.latitude,
          io,
        })
      } catch {
        socket.emit('delivery:location:error', { message: 'Location update was not saved.' })
      }
    })
  })

  return io
}
