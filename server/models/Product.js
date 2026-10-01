import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    images: [{ type: String }],
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, default: null },
    unit: { type: String, required: true },
    barcode: { type: String, default: '', trim: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    isAvailable: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
)

function hideDeleted() {
  if (this.getOptions().includeDeleted) return
  this.where({ isDeleted: { $ne: true } })
}

productSchema.pre(/^find/, hideDeleted)
productSchema.pre(/^count/, hideDeleted)

productSchema.index({ name: 1, shop: 1 })
productSchema.index({ category: 1 })
productSchema.index({ shop: 1, category: 1, isDeleted: 1 })
productSchema.index(
  { shop: 1, barcode: 1 },
  { unique: true, partialFilterExpression: { barcode: { $type: 'string', $gt: '' } } }
)

export default mongoose.model('Product', productSchema)
