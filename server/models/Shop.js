import mongoose from 'mongoose'

const shopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    logo: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    gstin: { type: String, default: '' },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pinCode: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    openingTime: { type: String, default: '08:00' },
    closingTime: { type: String, default: '21:00' },
    isManuallyClosed: { type: Boolean, default: false },
    approvalStatus: {
      type: String,
      enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED'],
      default: 'PENDING_APPROVAL',
    },
    rejectionNote: { type: String, default: '' },
    deliveryAvailable: { type: Boolean, default: true },
    pickupAvailable: { type: Boolean, default: true },
    deliveryRadius: { type: Number, default: 5 },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    prepTimeMin: { type: Number, default: 15 },
    prepTimeMax: { type: Number, default: 30 },
  },
  { timestamps: true }
)

shopSchema.index({ location: '2dsphere' })
shopSchema.index({ name: 1 })
shopSchema.index({ approvalStatus: 1 })

export default mongoose.model('Shop', shopSchema)
