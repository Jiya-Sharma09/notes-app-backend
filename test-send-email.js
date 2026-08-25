require('dotenv').config();
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const { sendEmail } = require('./services/send-email');
const { emailVerificationOtp } = require('./templates/emails/email-verification-otp');
const { otpGenerator } = require('./utils/otp-generator');

sendEmail('jish.022006@gmail.com', 'Email Verification OTP', emailVerificationOtp(otpGenerator()));

