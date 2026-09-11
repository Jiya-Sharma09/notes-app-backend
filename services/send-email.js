require('dotenv').config();
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(email, subject, html) {
  let data = null;
  let error = null;
  try {
    ({ data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: subject,
      html: html,
    }));

    if (error) {
      console.error('Resend API returned an error:', error);
      throw new Error('EMAIL_SEND_FAILED');
    }

  } catch (err) {
    console.error('Failed to send email:', err);
    throw new Error('EMAIL_SEND_FAILED');
  }
  return data;
}

module.exports = { sendEmail };