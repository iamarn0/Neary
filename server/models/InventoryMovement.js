import mongoose from 'mongoose'

const movementSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    type: {
      type: String,
      enum: ['STOCK_RECEIVED', 'ORDER_RESERVED', 'ORDER_CANCELLED', 'MANUAL_ADJUSTMENT'],
      required: true,
    },
    quantity: { type: Number, required: true },
    reason: { type: String, default: '' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  },
  { timestamps: true }
)

movementSchema.index({ shop: 1, createdAt: -1 })

export default mongoose.model('InventoryMovement', movementSchema)
