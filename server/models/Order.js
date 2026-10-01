import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, default: '' },
    image: { type: String, default: '' },
  },
  { _id: false }
)

const statusEventSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    at: { type: Date, default: Date.now },
    note: { type: String, default: '' },
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    channel: { type: String, enum: ['ONLINE', 'COUNTER'], default: 'ONLINE' },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      required() {
        return this.channel !== 'COUNTER'
      },
    },
    customerName: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    fulfillmentMethod: { type: String, enum: ['DELIVERY', 'PICKUP', 'COUNTER'], required: true },
    shippingAddress: { type: Object, default: null },
    paymentMethod: { type: String, enum: ['UPI', 'CARD', 'COD', 'CASH'], required: true },
    paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'FAILED'], default: 'PENDING' },
    paymentProvider: { type: String, default: 'mock' },
    paymentReference: { type: String, default: '' },
    paymentNote: { type: String, default: '' },
    orderStatus: {
      type: String,
      enum: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'PICKED_UP', 'BILLED', 'CANCELLED', 'REJECTED'],
      default: 'PLACED',
      index: true,
    },
    pickupCode: { type: String, default: '' },
    delivery: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery', default: null, index: true },
    notes: { type: String, default: '' },
    distanceKm: { type: Number, default: 0 },
    etaMin: { type: Number, default: 20 },
    etaMax: { type: Number, default: 35 },
    statusHistory: [statusEventSchema],
  },
  { timestamps: true }
)

orderSchema.index({ customer: 1, createdAt: -1 })
orderSchema.index({ shop: 1, orderStatus: 1, createdAt: -1 })

export default mongoose.model('Order', orderSchema)
