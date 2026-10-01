import { MongoMemoryServer } from 'mongodb-memory-server'

const server = await MongoMemoryServer.create({
  instance: {
    port: 27017,
    dbName: 'neare',
    ip: '127.0.0.1',
  },
})

console.log(`Temporary MongoDB at ${server.getUri()}`)

async function shutdown() {
  await server.stop()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
