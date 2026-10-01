import mongoose from 'mongoose'

const addressSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    flat: { type: String, required: true, trim: true },
    building: { type: String, default: '' },
    area: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pinCode: { type: String, required: true, trim: true },
    landmark: { type: String, default: '' },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: undefined },
    },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export default mongoose.model('Address', addressSchema)
