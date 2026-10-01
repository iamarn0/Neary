export function requestLogger(req, res, next) {
  const started = Date.now()
  res.on('finish', () => {
    const path = req.originalUrl?.split('?')[0] || req.path
    if (!path.startsWith('/api')) return
    const entry = {
      request: req.method,
      route: path,
      status: res.statusCode,
      duration: Date.now() - started,
    }
    if (res.locals.errorCode) entry.code = res.locals.errorCode
    console.log(JSON.stringify(entry))
  })
  next()
}
