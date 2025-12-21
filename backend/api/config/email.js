const nodemailer = require("nodemailer");

// Brevo SMTP transporter setup
const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false, // TLS
    auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_KEY
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
            from: '"Divisely" <noreply@wisely.tr>',
            replyTo: 'support@wisely.tr',
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

module.exports = { sendVerificationEmail };

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
            from: '"Divisely" <noreply@wisely.tr>',
            replyTo: 'support@wisely.tr',
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
