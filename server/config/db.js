import mongoose from 'mongoose'

export async function connectDb() {
  const uri = process.env.MONGO_URI
  if (!uri) {
    throw new Error('MONGO_URI is not set')
  }
  mongoose.set('strictQuery', true)
  const attempts = Number(process.env.MONGO_CONNECT_ATTEMPTS) || 15
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await mongoose.connect(uri)
      console.log('MongoDB connected')
      return
    } catch (error) {
      lastError = error
      if (attempt === attempts) break
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }
  throw lastError
}
