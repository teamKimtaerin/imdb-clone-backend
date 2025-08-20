const nodemailer = require('nodemailer');

// Create transporter for sending emails
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Send verification email with code
const sendVerificationEmail = async (email, verificationCode) => {
    try {
        const mailOptions = {
            from: process.env.FROM_EMAIL || 'noreply@imdb-clone.com',
            to: email,
            subject: 'IMDb Clone - Email Verification Code',
            html: getVerificationEmailTemplate(verificationCode)
        };

        const info = await transporter.sendMail(mailOptions);
        
        console.log('Verification email sent to:', email, 'with code:', verificationCode);
        if (process.env.NODE_ENV === 'development') {
            console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
        }
        
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Email sending error:', error);
        return { success: false, error: error.message };
    }
};

// Email template for verification code
const getVerificationEmailTemplate = (verificationCode) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #f4f4f4; }
            .logo { font-size: 28px; font-weight: bold; color: #e50914; }
            .content { padding: 30px 0; }
            .verification-code { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-align: center;
                padding: 20px;
                border-radius: 10px;
                font-size: 32px;
                font-weight: bold;
                letter-spacing: 5px;
                margin: 20px 0;
            }
            .footer { text-align: center; color: #666; font-size: 12px; border-top: 1px solid #f4f4f4; padding-top: 20px; }
            .warning { color: #e74c3c; font-size: 14px; margin-top: 15px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🎬 IMDb Clone</div>
            </div>
            
            <div class="content">
                <h2>Email Verification</h2>
                <p>Welcome to IMDb Clone!</p>
                <p>Please enter this verification code to verify your email address:</p>
                
                <div class="verification-code">${verificationCode}</div>
                
                <p>This code will expire in <strong>15 minutes</strong>.</p>
                
                <div class="warning">
                    <strong>Note:</strong> If you didn't create an account, please ignore this email.
                </div>
            </div>
            
            <div class="footer">
                <p>© 2024 IMDb Clone. All rights reserved.</p>
                <p>This is an automated email. Please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

// Send password reset email (for future use)
const sendPasswordResetEmail = async (email, resetToken) => {
    try {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        
        const mailOptions = {
            from: process.env.FROM_EMAIL || 'noreply@imdb-clone.com',
            to: email,
            subject: 'IMDb Clone - 비밀번호 재설정',
            html: `
                <h2>비밀번호 재설정</h2>
                <p>비밀번호를 재설정하려면 아래 링크를 클릭하세요:</p>
                <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #e50914; color: white; text-decoration: none; border-radius: 5px;">
                    비밀번호 재설정
                </a>
                <p>이 링크는 1시간 후에 만료됩니다.</p>
                <p>비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시해주세요.</p>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Password reset email error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail
};