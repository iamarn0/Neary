import mongoose from 'mongoose'

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
)

const cartSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', default: null },
    items: [cartItemSchema],
  },
  { timestamps: true }
)

export default mongoose.model('Cart', cartSchema)
