require('dotenv').config();
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(email, subject, html) {
  const { data, error } = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: email,
    subject: subject,
    html: html,
  });
  if (error) {
    console.error('Failed:', error);
    return;
  }
  console.log('Sent:', data);
}

module.exports = { sendEmail };