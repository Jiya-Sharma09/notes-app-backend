const {z} = require('zod')

const addSchema = z.object({
    title: z.string().min(1, "Title can't be empty"),
    content: z.string().min(1)
})

const updateSchema = addSchema.partial().refine(
    (data) => Object.keys(data).length>0, {
        message: "Atleast one field must change for you to update the note!"
    }
)

module.exports = {addSchema, updateSchema}