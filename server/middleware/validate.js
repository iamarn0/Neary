import { validationResult } from 'express-validator'
import { ApiError } from '../utils/http.js'

export function validate(req, res, next) {
  const result = validationResult(req)
  if (!result.isEmpty()) {
    return next(new ApiError(400, result.array()[0].msg))
  }
  next()
}
