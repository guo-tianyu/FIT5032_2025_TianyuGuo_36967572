function createResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    },
    isBase64Encoded: false,
    body: JSON.stringify(data)
  }
}

export async function handler(event) {
  try {
    let request

    if (Buffer.isBuffer(event)) {
      request = JSON.parse(event.toString('utf8'))
    } else if (typeof event === 'string') {
      request = JSON.parse(event)
    } else {
      request = event || {}
    }

    const method = request.requestContext?.http?.method || request.httpMethod || 'GET'

    if (method === 'OPTIONS') {
      return createResponse(200, { ok: true })
    }

    let rawBody = request.body || '{}'

    if (request.isBase64Encoded && typeof rawBody === 'string') {
      rawBody = Buffer.from(rawBody, 'base64').toString('utf8')
    }

    const payload = typeof rawBody === 'string' ? JSON.parse(rawBody || '{}') : rawBody
    const books = Array.isArray(payload.books) ? payload.books : []

    if (payload.action === 'sellFirestoreData') {
      if (books.length === 0) {
        return createResponse(400, {
          ok: false,
          error: 'No Firestore records were supplied for sale'
        })
      }

      const pricePerRecord = 2.5
      const totalPrice = Number((books.length * pricePerRecord).toFixed(2))
      const invoiceId = `FIT5032-${Date.now().toString(36).toUpperCase()}-${Math.random()
        .toString(36)
        .slice(2, 7)
        .toUpperCase()}`

      return createResponse(200, {
        ok: true,
        action: 'sellFirestoreData',
        invoiceId,
        source: 'Cloud Firestore / books',
        recordCount: books.length,
        pricePerRecord,
        totalPrice,
        currency: 'AUD',
        license: 'Single-use research dataset',
        status: 'SOLD',
        soldAt: new Date().toISOString(),
        platform: 'Alibaba Cloud Function Compute'
      })
    }

    return createResponse(200, {
      ok: true,
      action: 'countBooks',
      count: books.length,
      message: `Successfully counted ${books.length} books`,
      countedAt: new Date().toISOString(),
      platform: 'Alibaba Cloud Function Compute'
    })
  } catch (error) {
    return createResponse(400, {
      ok: false,
      count: 0,
      error: 'Invalid JSON payload'
    })
  }
}
