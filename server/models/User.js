import mongoose from 'mongoose'

const partnerProfileSchema = new mongoose.Schema(
  {
    city: { type: String, required: true, trim: true },
    area: { type: String, required: true, trim: true },
    baseLocation: {
      type: { type: String, enum: ['Point'], required: true },
      coordinates: { type: [Number], required: true },
    },
    partnerStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'],
      default: 'PENDING',
    },
    payoutLabel: { type: String, default: 'Demo payout profile' },
    statusNote: { type: String, default: '' },
  },
  { _id: false }
)

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['CUSTOMER', 'SHOP_OWNER', 'DELIVERY_PARTNER', 'ADMIN'],
      default: 'CUSTOMER',
    },
    avatar: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    isOnline: { type: Boolean, default: false },
    favoriteShops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shop' }],
    favoriteProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    partnerProfile: { type: partnerProfileSchema, default: undefined },
  },
  { timestamps: true }
)

userSchema.index({ 'partnerProfile.baseLocation': '2dsphere' })
userSchema.index({ role: 1, isActive: 1, 'partnerProfile.partnerStatus': 1 })

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject()
  delete obj.password
  return obj
}

export function partnerStatusOf(user) {
  return user?.partnerProfile?.partnerStatus || 'PENDING'
}

export default mongoose.model('User', userSchema)
