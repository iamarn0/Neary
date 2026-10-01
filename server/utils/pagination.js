export function pageParams(query, fallbackLimit = 20) {
  const page = Math.max(1, Math.floor(Number(query.page) || 1))
  const limit = Math.min(50, Math.max(1, Math.floor(Number(query.limit) || fallbackLimit)))
  return { page, limit, skip: (page - 1) * limit }
}

export function pageMeta(total, page, limit) {
  return {
    page,
    limit,
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
  }
}
