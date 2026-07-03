require('dotenv').config()
const express = require('express')

const authRoutes = require('./auth')
const notesRoutes = require('./notes')
const {  genLimiter} = require('./middleware/rate-limiters')

const app = express()
app.use(express.json())

// routes
app.use('/auth', authRoutes)
app.use('/notes',genLimiter, notesRoutes)

// global error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ message: 'Something went wrong' })
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
})