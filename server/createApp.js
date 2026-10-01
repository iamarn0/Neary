import express from 'express'
import routes from './routes/index.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'

export function createApp() {
  const app = express()
  app.use(express.json({ limit: '1mb' }))
  app.use('/api', routes)
  app.use(notFound)
  app.use(errorHandler)
  return app
}
