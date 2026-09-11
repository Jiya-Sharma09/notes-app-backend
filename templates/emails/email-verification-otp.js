function emailVerificationOtp(otp) {
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #333;">Email Verification</h2>
        <p style="color: #555;">Your One-Time Password (OTP) for email verification is:</p>
        <h1 style="color: #007BFF;">${otp}</h1>
        <p style="color: #555;">Please enter this OTP in the application to verify your email address.</p>
        <p style="color: #999; font-size: 12px;">If you did not request this, please ignore this email.</p>
    </div>
    `;
    return html;
}

module.exports = { emailVerificationOtp };