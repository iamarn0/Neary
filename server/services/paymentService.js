import { ApiError } from '../utils/http.js'

/**
 * Payment provider boundary.
 * V1 ships MockPaymentProvider only. A Razorpay adapter can implement the same two methods later.
 */
const MockPaymentProvider = {
  async createPaymentIntent({ method, amount, orderNumber }) {
    if (!['UPI', 'CARD', 'COD'].includes(method)) {
      throw new ApiError(400, 'Choose UPI, card, or cash on delivery.')
    }
    return {
      provider: 'mock',
      orderNumber,
      amount,
      method,
      mock: true,
    }
  },

  async confirmPayment({ method, orderNumber }) {
    if (method === 'COD') {
      return {
        provider: 'mock',
        status: 'PENDING',
        reference: '',
        note: 'Cash on delivery. This is a simulated checkout — nothing was charged.',
      }
    }
    return {
      provider: 'mock',
      status: 'PAID',
      reference: `mock_${orderNumber}`,
      note: 'Simulated payment. No money was sent to a real provider.',
    }
  },
}

export async function createPaymentIntent(input) {
  return MockPaymentProvider.createPaymentIntent(input)
}

export async function confirmPayment(input) {
  return MockPaymentProvider.confirmPayment(input)
}
