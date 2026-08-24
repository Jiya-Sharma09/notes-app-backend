require('dotenv').config();
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function testSend() {
  const { data, error } = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'jish.022006@gmail.com', // your Resend signup email, from the screenshot
    subject: 'Test OTP email',
    html: '<p>Your OTP is <strong>123456</strong></p>',
  });
  if (error) {
    console.error('Failed:', error);
    return;
  }
  console.log('Sent:', data);
}

testSend();