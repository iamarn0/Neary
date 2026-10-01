import mongoose from 'mongoose'

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 1000 },
})

counterSchema.statics.nextOrderNumber = async function nextOrderNumber() {
  const counter = await this.findOneAndUpdate(
    { name: 'order' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  )
  return `NE-${counter.seq}`
}

export default mongoose.model('Counter', counterSchema)
