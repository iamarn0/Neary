import 'dotenv/config'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { connectDb } from './config/db.js'
import routes from './routes/index.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import { requestLogger } from './middleware/requestLogger.js'
import { initSocket } from './sockets/index.js'
import { resumeDemoTracking } from './services/demoTracking.js'

const app = express()
const server = http.createServer(app)
const port = Number(process.env.PORT) || 5000

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error('JWT_SECRET must be set to a value of at least 16 characters.')
  process.exit(1)
}

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use(requestLogger)

const root = path.dirname(fileURLToPath(import.meta.url))
app.use('/uploads', express.static(path.join(root, 'uploads')))

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'NEARE API is running.', data: { ok: true } })
})

app.use('/api', routes)
app.use(notFound)
app.use(errorHandler)

const io = initSocket(server)
app.set('io', io)

await connectDb()
await resumeDemoTracking(io)

server.listen(port, () => {
  console.log(`NEARE API listening on ${port}`)
})
