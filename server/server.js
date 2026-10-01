import 'dotenv/config'
import fs from 'fs'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { clientOrigin } from './config/clientOrigin.js'
import { connectDb } from './config/db.js'
import User from './models/User.js'
import { seedDemo } from './seed/seed.js'
import routes from './routes/index.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import { requestLogger } from './middleware/requestLogger.js'
import { cloudinaryConfigured } from './middleware/upload.js'
import { initSocket } from './sockets/index.js'
import { resumeDemoTracking } from './services/demoTracking.js'

const app = express()
const server = http.createServer(app)
const port = Number(process.env.PORT) || 5000

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error('JWT_SECRET must be set to a value of at least 16 characters.')
  process.exit(1)
}

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      upgradeInsecureRequests: null,
      scriptSrc: ["'self'", 'blob:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: ["'self'", 'https:', 'wss:'],
      workerSrc: ["'self'", 'blob:'],
    },
  },
}))
app.use(cors({ origin: clientOrigin(), credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use(requestLogger)

const root = path.dirname(fileURLToPath(import.meta.url))
app.use('/uploads', express.static(path.join(root, 'uploads')))

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'NEARE API is running.', data: { ok: true } })
})

app.use('/api', routes)

const clientDist = path.join(root, '..', 'client', 'dist')
if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  app.use(express.static(clientDist))
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/socket.io')) return next()
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

app.use(notFound)
app.use(errorHandler)

const io = initSocket(server)
app.set('io', io)

if (process.env.NODE_ENV === 'production' && !cloudinaryConfigured()) {
  console.error('Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.')
  process.exit(1)
}
console.log(`Image storage: ${cloudinaryConfigured() ? 'cloudinary' : 'local disk'}`)

server.listen(port, '0.0.0.0', () => {
  console.log(`NEARE API listening on 0.0.0.0:${port}`)
})

try {
  await connectDb()
  if (process.env.SEED_IF_EMPTY === 'true' && (await User.countDocuments()) === 0) {
    console.log('Database is empty. Seeding demo data.')
    await seedDemo()
  }
  await resumeDemoTracking(io)
} catch (error) {
  console.error('Startup failed:', error)
  process.exit(1)
}
