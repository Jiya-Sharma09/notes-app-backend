const {createRateLimiter} =  require('./rate-limit')

 const authLimiter = createRateLimiter({
    windowMs: 15* 60 * 1000, 
    max: 5, 
    message: 'Too many login attempts. Try again in 15 minutes.'
})

 const genLimiter = createRateLimiter({
    windowMs: 15* 60* 1000, 
    max: 15
})

 const aiLimiter = createRateLimiter({
    windowMs: 60* 60* 1000,
    max: 15, 
    message: 'AI limit reached. Try again after one hour.'
})

module.exports = {authLimiter, genLimiter, aiLimiter}