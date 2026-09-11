require('dotenv').config()

const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('./prisma/client')
const { registerSchema, loginSchema, verifyOtpSchema, resendOtpSchema } = require('./middleware/validators/auth_validator')
const validate = require('./middleware/validate')
const { authLimiter, genLimiter } = require('./middleware/rate-limiters')
const authenticate = require('./middleware/authenticate')
const { createAndSendOtp, verifyOtp, PURPOSES } = require('./services/otp-service')

const router = express.Router()

// REGISTER
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password } = req.body

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ message: "User email id already exists. Either use another email to register or login." })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword }
    })

    // Fire off the verification OTP. If email sending fails, the user account
    // still exists (that's correct — don't lose their registration), but we
    // tell them honestly so they know to hit /resend-otp rather than assuming
    // an email is on its way.
    try {
      await createAndSendOtp(user.id, user.email, PURPOSES.SIGNUP_VERIFY)
    } catch (otpErr) {
      console.error('createAndSendOtp failed during /register:', otpErr)
      return res.status(201).json({
        message: 'User created, but the verification email could not be sent. Please request a new OTP.',
        userId: user.id,
        email: user.email,
        emailSent: false
      })
    }

    res.status(201).json({
      message: 'User created. Please check your email for a verification code.',
      userId: user.id,
      email: user.email,
      emailSent: true
    })
  } catch (err) {
    next(err)
  }
})

// VERIFY OTP (signup)
router.post('/verify-otp', validate(verifyOtpSchema), async (req, res, next) => {
  try {
    const { userId, otp } = req.body

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' })
    }

    try {
      await verifyOtp(userId, otp, PURPOSES.SIGNUP_VERIFY)
    } catch (otpErr) {
      if (otpErr.code === 'GUESS_LOCKED_OUT') {
        return res.status(429).json({ code: otpErr.code, message: otpErr.message })
      }
      if (otpErr.code === 'NO_VALID_OTP' || otpErr.code === 'INCORRECT_OTP') {
        return res.status(400).json({ code: otpErr.code, message: otpErr.message })
      }
      console.error('verifyOtp failed with an unexpected error during /verify-otp:', otpErr)
      throw otpErr
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true }
    })

    res.json({ message: 'Email verified successfully. You can now log in.' })
  } catch (err) {
    next(err)
  }
})

// RESEND OTP (signup)
router.post('/resend-otp', genLimiter, validate(resendOtpSchema), async (req, res, next) => {
  try {
    const { userId } = req.body

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' })
    }

    try {
      await createAndSendOtp(user.id, user.email, PURPOSES.SIGNUP_VERIFY)
    } catch (otpErr) {
      if (otpErr.code === 'RESEND_RATE_LIMITED') {
        return res.status(429).json({ code: otpErr.code, message: otpErr.message })
      }
      // EMAIL_SEND_FAILED or anything unexpected
      console.error('createAndSendOtp failed during /resend-otp:', otpErr)
      return res.status(502).json({ message: 'Could not send verification email. Please try again shortly.' })
    }

    res.json({ message: 'A new verification code has been sent to your email.' })
  } catch (err) {
    next(err)
  }
})

// LOGIN
router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Verified check happens AFTER password check, deliberately — checking
    // it first would leak "this account exists and is unverified" to anyone
    // who tries the email with a wrong password (account enumeration).
    if (!user.isVerified) {
      return res.status(403).json({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email before logging in.',
        userId: user.id
      })
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    })
  } catch (err) {
    next(err)
  }
})

// GET /auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true }
    })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json({ user })
  } catch (err) {
    next(err)
  }
})

module.exports = router