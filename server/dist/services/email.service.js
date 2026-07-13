"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOTPVerificationEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525'),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
const sendOTPVerificationEmail = async (email, otp) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@nexusai.com',
            to: email,
            subject: 'Verify Your NexusAI Account',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #8b5cf6;">Welcome to NexusAI</h2>
          <p>Please use the following 6-digit OTP code to verify your email address. This code will expire in 10 minutes.</p>
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #64748b; font-size: 14px;">If you didn't request this code, you can safely ignore this email.</p>
        </div>
      `,
        };
        await transporter.sendMail(mailOptions);
        return true;
    }
    catch (error) {
        console.error('Error sending OTP email:', error);
        return false;
    }
};
exports.sendOTPVerificationEmail = sendOTPVerificationEmail;
