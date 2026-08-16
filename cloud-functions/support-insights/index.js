const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

function jsonResponse(statusCode, body) {
  return { statusCode, headers: corsHeaders, isBase64Encoded: false, body: JSON.stringify(body) }
}

function normaliseEvent(event) {
  if (Buffer.isBuffer(event)) return JSON.parse(event.toString('utf8'))
  if (typeof event === 'string') return JSON.parse(event)
  return event || {}
}

function readPayload(request) {
  let body = request.body || '{}'
  if (request.isBase64Encoded && typeof body === 'string') {
    body = Buffer.from(body, 'base64').toString('utf8')
  }
  return typeof body === 'string' ? JSON.parse(body || '{}') : body
}

function positiveNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : 0
}

function countCategories(requests) {
  const result = {}
  requests.forEach((request) => {
    const label = typeof request.category === 'string' && request.category.trim()
      ? request.category.trim().slice(0, 80)
      : 'Uncategorised'
    result[label] = (result[label] || 0) + 1
  })
  return result
}

function chooseRecommendation(openRequests, occupancyRate) {
  if (openRequests >= 10) return 'Prioritise the support queue and assign an additional coordinator.'
  if (occupancyRate >= 85) return 'Workshop demand is high. Consider adding another session or increasing capacity.'
  if (openRequests > 0) return 'Review outstanding requests before the next workshop cycle.'
  return 'Current service demand is manageable. Continue monitoring new requests and bookings.'
}

function analyseService(requests, workshops) {
  const openRequests = requests.filter(({ status }) => status !== 'Resolved').length
  const resolvedRequests = requests.filter(({ status }) => status === 'Resolved').length
  const totalCapacity = workshops.reduce((sum, { capacity }) => sum + positiveNumber(capacity), 0)
  const totalBookings = workshops.reduce((sum, workshop) => {
    const bookings = workshop.bookings !== undefined ? workshop.bookings : workshop.booked
    return sum + positiveNumber(bookings)
  }, 0)
  const occupancyRate = totalCapacity ? Math.round((totalBookings / totalCapacity) * 100) : 0

  return {
    overview: {
      totalRequests: requests.length,
      openRequests,
      resolvedRequests,
      totalWorkshops: workshops.length,
      publishedWorkshops: workshops.filter(({ published }) => published === true).length,
      totalCapacity,
      totalBookings,
      occupancyRate
    },
    categoryBreakdown: countCategories(requests),
    recommendation: chooseRecommendation(openRequests, occupancyRate)
  }
}

exports.handler = function handler(event, context, callback) {
  const finish = (statusCode, body) => callback(null, jsonResponse(statusCode, body))

  try {
    const request = normaliseEvent(event)
    const method = request.requestContext?.http?.method || request.httpMethod || 'POST'
    if (method === 'OPTIONS') return finish(200, { ok: true })
    if (method !== 'POST') return finish(405, { ok: false, error: 'POST requests only' })

    const payload = readPayload(request)
    if (payload.action !== 'generateServiceInsights') {
      return finish(400, { ok: false, error: 'Unsupported action' })
    }

    const requests = Array.isArray(payload.requests) ? payload.requests.slice(0, 250) : []
    const workshops = Array.isArray(payload.workshops) ? payload.workshops.slice(0, 250) : []

    return finish(200, {
      ok: true,
      action: 'generateServiceInsights',
      ...analyseService(requests, workshops),
      analysedAt: new Date().toISOString(),
      platform: 'Alibaba Cloud Function Compute'
    })
  } catch {
    return finish(400, { ok: false, error: 'Invalid JSON payload' })
  }
}
