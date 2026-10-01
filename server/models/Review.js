import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '', maxlength: 600 },
  },
  { timestamps: true }
)

reviewSchema.index({ shop: 1, createdAt: -1 })
reviewSchema.index({ customer: 1, createdAt: -1 })

export default mongoose.model('Review', reviewSchema)
