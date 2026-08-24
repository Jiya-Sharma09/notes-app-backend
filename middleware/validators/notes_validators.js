const { z } = require('zod')

const addSchema = z.object({
    title: z.string().min(1, "Title can't be empty"),
    content: z.string().min(1)
})

const updateSchema = addSchema.partial().refine(
    (data) => Object.keys(data).length > 0, {
    message: "Atleast one field must change for you to update the note!"
}
)

const searchSchema = z.object({
    title: z.string().min(1).optional(),
    createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date format YYYY-MM-DD").optional()
}).refine(
    (data) => Object.keys(data).length > 0, {
    message: "Provide valid search query."
}
)

module.exports = { addSchema, updateSchema, searchSchema }