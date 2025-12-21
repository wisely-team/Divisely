const nodemailer = require("nodemailer");

// Get sender email from env or use default
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'noreply@wisely.tr';
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Divisely';

// Log configuration at startup (without secrets)
console.log('[EMAIL CONFIG] Brevo SMTP configured:');
console.log(`  - Host: smtp-relay.brevo.com:587`);
console.log(`  - User: ${process.env.BREVO_SMTP_USER ? 'SET (' + process.env.BREVO_SMTP_USER + ')' : 'NOT SET'}`);
console.log(`  - Key: ${process.env.BREVO_SMTP_KEY ? 'SET (hidden)' : 'NOT SET'}`);
console.log(`  - Sender: ${SENDER_NAME} <${SENDER_EMAIL}>`);

// Brevo SMTP transporter setup with timeouts
const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false, // TLS via STARTTLS
    auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_KEY
    },
    connectionTimeout: 10000, // 10 seconds to establish connection
    greetingTimeout: 10000,   // 10 seconds for SMTP greeting
    socketTimeout: 30000,     // 30 seconds for socket operations
    logger: true,             // Enable logging
    debug: true               // Enable debug output
});

// Verify transporter connection at startup
transporter.verify(function (error, success) {
    if (error) {
        console.error('[EMAIL CONFIG] SMTP connection verification FAILED:', error.message);
    } else {
        console.log('[EMAIL CONFIG] SMTP connection verified successfully');
    }
});

// Verification email template
function getVerificationEmailHTML(username, verificationCode) {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #3f6e69; margin: 0;">Divisely</h1>
                    <p style="color: #666; margin-top: 5px;">Email Verification</p>
                </div>

                <p style="color: #333; font-size: 16px;">Hi ${username},</p>
                
                <p style="color: #666; line-height: 1.6;">
                    Thank you for signing up for Divisely! To complete your registration, please verify your email address using the code below:
                </p>

                <div style="background-color: #f0f0f0; border-left: 4px solid #3f6e69; padding: 20px; margin: 30px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #666;">Your verification code:</p>
                    <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #3f6e69; text-align: center;">
                        ${verificationCode}
                    </p>
                </div>

                <p style="color: #666; line-height: 1.6;">
                    This code will expire in <strong>10 minutes</strong>. If you didn't request this code, please ignore this email.
                </p>

                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

                <p style="color: #999; font-size: 12px; text-align: center;">
                    If you have any questions, please contact us at support@wisely.tr
                </p>
            </div>
        </div>
    `;
}

// Send verification email
async function sendVerificationEmail(email, username, verificationCode) {
    try {
        const mailOptions = {
            from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
            replyTo: SENDER_EMAIL,
            to: email,
            subject: "Verify your Divisely email address",
            html: getVerificationEmailHTML(username, verificationCode)
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SENT] Verification email sent to ${email}. Message ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`[EMAIL ERROR] Failed to send verification email to ${email}:`, error);
        return false;
    }
}


// Password reset email template
function getPasswordResetEmailHTML(username, resetCode) {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #3f6e69; margin: 0;">Divisely</h1>
                    <p style="color: #666; margin-top: 5px;">Password Reset</p>
                </div>

                <p style="color: #333; font-size: 16px;">Hi ${username},</p>
                
                <p style="color: #666; line-height: 1.6;">
                    We received a request to reset your password. Use the code below to reset it:
                </p>

                <div style="background-color: #f0f0f0; border-left: 4px solid #e74c3c; padding: 20px; margin: 30px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #666;">Your password reset code:</p>
                    <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #e74c3c; text-align: center;">
                        ${resetCode}
                    </p>
                </div>

                <p style="color: #666; line-height: 1.6;">
                    This code will expire in <strong>10 minutes</strong>. If you didn't request this, please ignore this email or contact support.
                </p>

                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

                <p style="color: #999; font-size: 12px; text-align: center;">
                    If you have any questions, please contact us at support@wisely.tr
                </p>
            </div>
        </div>
    `;
}

// Send password reset email
async function sendPasswordResetEmail(email, username, resetCode) {
    try {
        const mailOptions = {
            from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
            replyTo: SENDER_EMAIL,
            to: email,
            subject: "Reset your Divisely password",
            html: getPasswordResetEmailHTML(username, resetCode)
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SENT] Password reset email sent to ${email}. Message ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`[EMAIL ERROR] Failed to send password reset email to ${email}:`, error);
        return false;
    }
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
