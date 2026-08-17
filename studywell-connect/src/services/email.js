import { firebaseAuth } from './firebase'

const emailFunctionUrl = import.meta.env.VITE_EMAIL_FUNCTION_URL || ''

export const emailServiceConfigured = Boolean(emailFunctionUrl)

export async function sendSupportSummaryEmail({
  toEmail,
  toName,
  subject,
  message,
  staffName,
  requestId,
  attachmentName,
  attachmentContent
}) {
  if (!emailServiceConfigured) throw new Error('The email function URL is not configured.')
  if (!firebaseAuth.currentUser) throw new Error('Sign in again before sending an email.')

  const idToken = await firebaseAuth.currentUser.getIdToken()
  const response = await fetch(emailFunctionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`
    },
    body: JSON.stringify({
      action: 'sendSupportSummary',
      toEmail,
      toName,
      subject,
      message,
      staffName,
      requestId,
      attachment: {
        name: attachmentName,
        content: attachmentContent
      }
    })
  })

  const result = await response.json().catch(() => ({}))
  if (!response.ok || !result.ok) {
    throw new Error(result.error || 'The email function could not send this message.')
  }
  return result
}
