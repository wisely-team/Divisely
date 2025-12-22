// Brevo HTTP API for email sending
// Uses REST API instead of SMTP to avoid port blocking on platforms like Render.com

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'noreply@wisely.tr';
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Divisely';

// Log configuration at startup
console.log('[EMAIL CONFIG] Brevo HTTP API configured:');
console.log(`  - API Key: ${BREVO_API_KEY ? 'SET (hidden)' : 'NOT SET'}`);
console.log(`  - Sender: ${SENDER_NAME} <${SENDER_EMAIL}>`);

if (!BREVO_API_KEY) {
    console.error('[EMAIL CONFIG] WARNING: BREVO_API_KEY is not set! Emails will NOT be sent.');
}

// Generic function to send email via Brevo HTTP API
async function sendEmailViaBrevo(to, subject, htmlContent) {
    if (!BREVO_API_KEY) {
        console.error('[EMAIL] Cannot send email: BREVO_API_KEY is not configured');
        return false;
    }

    console.log(`[EMAIL] Sending to: ${to}, Subject: ${subject}`);

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': BREVO_API_KEY,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                sender: {
                    name: SENDER_NAME,
                    email: SENDER_EMAIL
                },
                to: [{ email: to }],
                subject: subject,
                htmlContent: htmlContent
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log(`[EMAIL SENT] Email sent successfully to ${to}. Message ID: ${data.messageId}`);
            return true;
        } else {
            console.error(`[EMAIL ERROR] Brevo API error:`, data);
            console.error(`[EMAIL ERROR] Status: ${response.status}, Code: ${data.code}, Message: ${data.message}`);
            return false;
        }
    } catch (error) {
        console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, error.message);
        return false;
    }
}

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
    // Always surface the code in logs for local/dev without email delivery
    console.log(`[DEV EMAIL] Verification code for ${email} (${username}): ${verificationCode}`);

    if (!BREVO_API_KEY) {
        console.warn('[DEV EMAIL] BREVO_API_KEY missing, skipping actual email send.');
        return true;
    }

    return sendEmailViaBrevo(
        email,
        "Verify your Divisely email address",
        getVerificationEmailHTML(username, verificationCode)
    );
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
    // Always surface the code in logs for local/dev without email delivery
    console.log(`[DEV EMAIL] Password reset code for ${email} (${username}): ${resetCode}`);

    if (!BREVO_API_KEY) {
        console.warn('[DEV EMAIL] BREVO_API_KEY missing, skipping actual email send.');
        return true;
    }

    return sendEmailViaBrevo(
        email,
        "Reset your Divisely password",
        getPasswordResetEmailHTML(username, resetCode)
    );
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
