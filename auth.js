require('dotenv').config()

const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('./prisma/client')
const { registerSchema, loginSchema } = require('./middleware/validators/auth_validator')
const validate = require('./middleware/validate')
const { authLimiter } = require('./middleware/rate-limiters')
const  authenticate  = require('./middleware/authenticate') // adjust path/name to match your actual file



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

    res.status(201).json({ message: 'User created', userId: user.id })
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