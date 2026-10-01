import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { describe, expect, it } from 'vitest'
import { assertImageSignature, publishImage } from '../middleware/upload.js'

const uploadDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads')
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0])

function run(middleware, req) {
  return new Promise((resolve, reject) => {
    middleware(req, {}, (error) => (error ? reject(error) : resolve(req)))
  })
}

describe('image upload', () => {
  it('rejects a file whose bytes are not an image', async () => {
    const req = { file: { mimetype: 'image/png', buffer: Buffer.from('not-a-png') } }
    await expect(run(assertImageSignature, req)).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_UPLOAD' })
  })

  it('stores a validated image on disk when Cloudinary is not configured', async () => {
    const previous = process.env.NODE_ENV
    delete process.env.CLOUDINARY_CLOUD_NAME
    delete process.env.CLOUDINARY_API_KEY
    delete process.env.CLOUDINARY_API_SECRET
    process.env.NODE_ENV = 'test'
    const req = { file: { mimetype: 'image/png', buffer: png } }
    try {
      await run(assertImageSignature, req)
      await run(publishImage, req)
      expect(req.file.publicUrl).toMatch(/^\/uploads\/.+\.png$/)
      const saved = await fs.readFile(path.join(uploadDir, req.file.filename))
      expect(saved.subarray(0, 4)).toEqual(png.subarray(0, 4))
      await fs.rm(path.join(uploadDir, req.file.filename), { force: true })
    } finally {
      if (previous === undefined) delete process.env.NODE_ENV
      else process.env.NODE_ENV = previous
    }
  })
})
