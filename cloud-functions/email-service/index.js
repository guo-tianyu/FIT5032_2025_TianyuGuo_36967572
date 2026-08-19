const https = require('https')
const nodemailer = require('nodemailer')

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*'
const corsHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

function postJson(url, payload) {
  return new Promise((resolve, reject) => {
    const target = new URL(url)
    const data = JSON.stringify(payload)
    const request = https.request({
      hostname: target.hostname,
      path: `${target.pathname}${target.search}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (response) => {
      let responseBody = ''
      response.on('data', (chunk) => { responseBody += chunk })
      response.on('end', () => {
        try {
          resolve({ statusCode: response.statusCode, data: JSON.parse(responseBody || '{}') })
        } catch {
          reject(new Error('The authentication service returned an invalid response.'))
        }
      })
    })
    request.setTimeout(10000, () => request.destroy(new Error('Authentication request timed out.')))
    request.on('error', reject)
    request.write(data)
    request.end()
  })
}

async function verifyStaff(request) {
  const headers = request.headers || {}
  const authorization = headers.authorization || headers.Authorization || ''
  const idToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!idToken) throw new Error('Missing Firebase authentication token.')
  if (!process.env.FIREBASE_API_KEY) throw new Error('Firebase verification is not configured.')

  const verification = await postJson(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(process.env.FIREBASE_API_KEY)}`,
    { idToken }
  )
  const uid = verification.data?.users?.[0]?.localId
  const allowedStaff = String(process.env.ALLOWED_STAFF_UIDS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  if (verification.statusCode !== 200 || !uid || !allowedStaff.includes(uid)) {
    throw new Error('This account is not authorised to send staff emails.')
  }
  return uid
}

function cleanText(value, maximum) {
  return String(value || '').trim().slice(0, maximum)
}

function validatePayload(payload) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  const toEmail = cleanText(payload.toEmail, 120).toLowerCase()
  const subject = cleanText(payload.subject, 120).replace(/[\r\n]+/g, ' ')
  const message = cleanText(payload.message, 1000)
  const attachmentName = cleanText(payload.attachment?.name, 80).replace(/[^a-zA-Z0-9._-]/g, '-')
  const attachmentContent = String(payload.attachment?.content || '')

  if (payload.action !== 'sendSupportSummary') throw new Error('Unsupported action.')
  if (!emailPattern.test(toEmail)) throw new Error('The recipient email is invalid.')
  if (subject.length < 5 || message.length < 20) throw new Error('The email content is incomplete.')
  if (!attachmentName.endsWith('.csv')) throw new Error('A CSV attachment is required.')
  if (!attachmentContent || Buffer.byteLength(attachmentContent, 'utf8') > 250000) {
    throw new Error('The CSV attachment is empty or too large.')
  }

  return {
    toEmail,
    toName: cleanText(payload.toName, 60),
    subject,
    message,
    staffName: cleanText(payload.staffName, 60),
    requestId: cleanText(payload.requestId, 80),
    attachmentName,
    attachmentContent
  }
}

function createTransporter() {
  const port = Number(process.env.SMTP_PORT || 465)
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_APP_PASSWORD) {
    throw new Error('SMTP is not configured.')
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_APP_PASSWORD
    }
  })
}

exports.handler = async function handler(event, context, callback) {
  const finish = (statusCode, body) => callback(null, jsonResponse(statusCode, body))

  try {
    const request = normaliseEvent(event)
    const method = request.requestContext?.http?.method || request.httpMethod || 'POST'
    if (method === 'OPTIONS') return finish(200, { ok: true })
    if (method !== 'POST') return finish(405, { ok: false, error: 'POST requests only.' })

    await verifyStaff(request)
    const email = validatePayload(readPayload(request))
    const transporter = createTransporter()
    await transporter.sendMail({
      from: `"${cleanText(process.env.SMTP_FROM_NAME || 'StudyWell Connect', 60).replace(/["\r\n]/g, '')}" <${process.env.SMTP_USER}>`,
      to: { name: email.toName, address: email.toEmail },
      subject: email.subject,
      text: `${email.message}\n\nSent by ${email.staffName || 'StudyWell staff'}.`,
      attachments: [{
        filename: email.attachmentName,
        content: Buffer.from(email.attachmentContent, 'utf8'),
        contentType: 'text/csv; charset=utf-8'
      }]
    })

    return finish(200, { ok: true, requestId: email.requestId })
  } catch (error) {
    const authenticationError = /authentication|authorised|token/i.test(error.message)
    return finish(authenticationError ? 403 : 400, {
      ok: false,
      error: error.message || 'The email could not be sent.'
    })
  }
}
