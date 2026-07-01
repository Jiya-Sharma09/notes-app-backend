const { z } = require('zod')

const registerSchema = z.object({
    email: z.string().email('invalid email'),
    password: z.string().min(8, 'Password must be atleast 8 characters long'),
    name: z.string().optional()
})

const loginSchema = z.object({
    email: z.string().email('must enter valid registered email'), 
    password: z.string().min(8, 'Password must be atleast 8 characters long')
})


module.exports = {registerSchema, loginSchema}