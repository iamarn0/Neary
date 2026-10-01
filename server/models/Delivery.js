import mongoose from 'mongoose'

const geoSchema = {
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], default: undefined },
}

const deliverySchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: {
      type: String,
      enum: ['OFFERED', 'ACCEPTED', 'PICKED_UP', 'DELIVERED', 'CANCELLED'],
      default: 'OFFERED',
    },
    pickupLocation: geoSchema,
    dropoffLocation: geoSchema,
    currentLocation: geoSchema,
    locationUpdatedAt: { type: Date, default: null },
    declinedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    acceptedAt: { type: Date, default: null },
    pickedUpAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    estimatedDeliveryTime: { type: Number, default: 30 },
    earnings: { type: Number, default: 0 },
    demoProgress: { type: Number, default: 0 },
  },
  { timestamps: true }
)

deliverySchema.index({ status: 1, deliveryPartner: 1 })
deliverySchema.index({ deliveryPartner: 1, status: 1, deliveredAt: -1 })

export default mongoose.model('Delivery', deliverySchema)
