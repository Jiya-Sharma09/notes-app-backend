const rateLimit = require('express-rate-limit')

 const createRateLimiter = ({windowMs, max, keyGenerator, message}) => {
    return rateLimit({
        windowMs, 
        max, 
        standardHeaders: true, 
        legacyHeaders: false, 
        keyGenerator, 
        message: {error: message || 'Too many requests, please try again later.'}
    })
}

module.exports = {createRateLimiter}