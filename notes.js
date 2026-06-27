const express = require('express')
const prisma = require('./prisma/client')
const authenticate = require('./middleware/authenticate')

const router = express.Router()

// protect all notes routes
router.use(authenticate)

// GET all notes
router.get('/', async (req, res, next) => {
  try {
    const notes = await prisma.note.findMany({
      where: { userId: req.user.userId }
    })
    res.json(notes)
  } catch (err) {
    next(err)
  }
})

// GET single note
router.get('/:id', async (req, res, next) => {
  try {
    const note = await prisma.note.findUnique({
      where: { id: parseInt(req.params.id) }
    })
    if (!note) return res.status(404).json({ message: 'Note not found' })
    if (note.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' })
    }
    res.json(note)
  } catch (err) {
    next(err)
  }
})

// POST - create note
router.post('/', async (req, res, next) => {
  try {
    const { title, content } = req.body
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' })
    }
    const note = await prisma.note.create({
      data: { title, content, userId: req.user.userId }
    })
    res.status(201).json(note)
  } catch (err) {
    next(err)
  }
})

// PUT - update note
router.put('/:id', async (req, res, next) => {
  try {
    const { title, content } = req.body
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' })
    }
    const note = await prisma.note.findUnique({
      where: { id: parseInt(req.params.id) }
    })
    if (!note) return res.status(404).json({ message: 'Note not found' })
    if (note.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' })
    }
    const updated = await prisma.note.update({
      where: { id: parseInt(req.params.id) },
      data: { title, content }
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// DELETE - delete note
router.delete('/:id', async (req, res, next) => {
  try {
    const note = await prisma.note.findUnique({
      where: { id: parseInt(req.params.id) }
    })
    if (!note) return res.status(404).json({ message: 'Note not found' })
    if (note.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' })
    }
    await prisma.note.delete({
      where: { id: parseInt(req.params.id) }
    })
    res.json({ message: 'Note deleted' })
  } catch (err) {
    next(err)
  }
})

module.exports = router