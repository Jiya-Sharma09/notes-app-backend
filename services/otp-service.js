const bcrypt = require('bcryptjs')
const prisma = require('../prisma/client')
const { otpGenerator } = require('../utils/otp-generator')
const { sendEmail } = require('./send-email')
const { emailVerificationOtp } = require('../templates/emails/email-verification-otp')

const OTP_EXPIRY_MS = 10 * 60 * 1000       // 10 minutes
const GUESS_LOCKOUT_MAX = 3
const GUESS_LOCKOUT_WINDOW_MS = 20 * 60 * 1000
const RESEND_MAX = 3
const RESEND_WINDOW_MS = 20 * 60 * 1000

const PURPOSES = {
  SIGNUP_VERIFY: 'SIGNUP_VERIFY',
  PASSWORD_RESET: 'PASSWORD_RESET',
}

// Has this user already requested too many OTPs (of this purpose) recently?
// Counted via OtpToken rows, per user+purpose — deliberately DB-scoped, not IP-scoped.
async function isResendRateLimited(userId, purpose) {
  const since = new Date(Date.now() - RESEND_WINDOW_MS)
  const count = await prisma.otpToken.count({
    where: { userId, purpose, createdAt: { gte: since } }
  })
  return count >= RESEND_MAX
}

// Has this user made too many wrong guesses (of this purpose) recently?
// Counted via OtpAttempt rows, per user+purpose — survives resends by design.
async function isGuessLockedOut(userId, purpose) {
  const since = new Date(Date.now() - GUESS_LOCKOUT_WINDOW_MS)
  const wrongCount = await prisma.otpAttempt.count({
    where: { userId, purpose, wasCorrect: false, createdAt: { gte: since } }
  })
  return wrongCount >= GUESS_LOCKOUT_MAX
}

// Generates an OTP, stores its hash, and emails it. Throws a typed error
// (err.code) the route layer can map to the right HTTP status.
async function createAndSendOtp(userId, email, purpose) {
  if (await isResendRateLimited(userId, purpose)) {
    const err = new Error('Too many OTP requests. Please wait before requesting another.')
    err.code = 'RESEND_RATE_LIMITED'
    throw err
  }

  const otp = otpGenerator()
  const otpHash = await bcrypt.hash(String(otp), 10)
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS)

  try {
    await prisma.otpToken.create({
      data: { userId, purpose, otpHash, expiresAt }
    })
  } catch (err) {
    console.error('Failed to create OTP token:', err)
    console.error('Failed to create OTP token:', err)
    const error = new Error('Failed to generate OTP.')
    error.code = 'OTP_GENERATION_FAILED'
    throw error
  }

  const { subject, html } = purpose === PURPOSES.SIGNUP_VERIFY
    ? { subject: 'Verify your email', html: emailVerificationOtp(otp) }
    : { subject: 'Reset your password', html: emailVerificationOtp(otp) }

  // If this throws (EMAIL_SEND_FAILED), the OtpToken row still exists —
  // that's fine, it'll just expire unused; the route layer decides what
  // to tell the user.
  await sendEmail(email, subject, html)
}

// Verifies a guessed OTP against the latest unconsumed, unexpired token
// for this user+purpose. Always records an OtpAttempt row, win or lose.
async function verifyOtp(userId, otpGuess, purpose) {
  if (await isGuessLockedOut(userId, purpose)) {
    const err = new Error('Too many incorrect attempts. Please wait before trying again.')
    err.code = 'GUESS_LOCKED_OUT'
    throw err
  }

  const token = await prisma.otpToken.findFirst({
    where: {
      userId,
      purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  })

  if (!token) {
    const err = new Error('No valid OTP found. Please request a new one.')
    err.code = 'NO_VALID_OTP'
    throw err
  }

  const isMatch = await bcrypt.compare(String(otpGuess), token.otpHash)

  await prisma.otpAttempt.create({
    data: { userId, purpose, wasCorrect: isMatch }
  })

  if (!isMatch) {
    const err = new Error('Incorrect OTP.')
    err.code = 'INCORRECT_OTP'
    throw err
  }

  await prisma.otpToken.update({
    where: { id: token.id },
    data: { consumedAt: new Date() }
  })

  return true
}

module.exports = { createAndSendOtp, verifyOtp, PURPOSES }