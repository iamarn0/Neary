import Notification from '../models/Notification.js'
import { asyncHandler, send } from '../utils/http.js'

export const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(30)
  const unread = notifications.filter((item) => !item.read).length
  send(res, { notifications, unread })
})

export const markRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, ...(req.params.id ? { _id: req.params.id } : {}) }, { read: true })
  send(res, { ok: true })
})
