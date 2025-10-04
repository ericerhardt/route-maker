import crypto from 'crypto'

export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function getInviteExpiration(): Date {
  const expiration = new Date()
  expiration.setDate(expiration.getDate() + 7) // 7 days
  return expiration
}
