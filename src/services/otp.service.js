// services/otp.service.js

import speakeasy from "speakeasy";
import nodemailer from "nodemailer";
import "dotenv/config";

/**
 * Generates a 6-digit TOTP using the user's email as part of the secret.
 * The OTP is valid for 10 minutes (step: 600 seconds).
 * @param {string} email - The user's email address
 * @returns {string} 6-digit OTP token
 */
const generateOTP = (email) => {
  const secret = `${process.env.OTP_SECRET}_${email}`;

  return speakeasy.totp({
    secret,
    encoding: "ascii",
    step: 600, // 10 minutes validity
    digits: 6,
  });
};

/**
 * Verifies the OTP token submitted by the user against the generated one.
 * window: 1 allows slight tolerance in case of minor clock differences.
 * @param {string} email - The user's email address
 * @param {string} token - The OTP entered by the user
 * @returns {boolean} True if valid, false if expired or incorrect
 */
const verifyOTPToken = (email, token) => {
  const secret = `${process.env.OTP_SECRET}_${email}`;

  return speakeasy.totp.verify({
    secret,
    encoding: "ascii",
    token,
    step: 600, // Must match the step used during generation
    digits: 6,
    window: 1, // Allows 1 step (10 min) tolerance for clock skew
  });
};

/**
 * Creates a Nodemailer transporter using Gmail SMTP.
 * Uses app password from .env for authentication.
 * @returns {nodemailer.Transporter}
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER, // Your Gmail address
      pass: process.env.MAIL_PASSWORD, // Gmail app password (not real password)
    },
  });
};

/**
 * Sends the OTP to the user's institution email address.
 * @param {string} email - Recipient's email
 * @param {string} otp - The generated OTP to include in the email
 * @returns {Promise<void>}
 */
const sendOTPEmail = async (email, otp) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"CTransit" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Verify your CTransit account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px;">
        
        <h2 style="color: #1a3c8f; margin-bottom: 8px;">
          CTransit Email Verification
        </h2>

        <p style="color: #444;">
          Use the OTP below to verify your email address.
          It expires in <strong>10 minutes</strong>.
        </p>

        <!-- OTP Display Box -->
        <div style="
          font-size: 36px;
          font-weight: bold;
          letter-spacing: 12px;
          color: #1a3c8f;
          background: #f0f4ff;
          padding: 20px;
          text-align: center;
          border-radius: 8px;
          margin: 24px 0;
          border: 1px solid #d0d9f5;
        ">
          ${otp}
        </div>

        <p style="color: #444; font-size: 14px;">
          Enter this code on the verification page to activate your account.
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />

        <p style="color: #aaa; font-size: 12px;">
          If you did not create a CTransit account, you can safely ignore this email.
          This OTP will expire automatically.
        </p>

      </div>
    `,
  });
};

export { generateOTP, verifyOTPToken, sendOTPEmail };
