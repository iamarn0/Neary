import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export default mongoose.model('Notification', notificationSchema)
