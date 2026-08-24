const validate = (schema, source = 'body') => (req, res, next)=>{
    const result = schema.safeParse(req[source])
    if(!result.success){
        return res.status(400).json({
            message: result.error.errors
        })
    }
    next()
}

module.exports = validate