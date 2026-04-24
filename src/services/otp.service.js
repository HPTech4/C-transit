import { totp } from "otplib";
import nodemailer from "nodemailer";
import prisma from "../lib/prisma.js";

// OTP is valid for 10 minutes
totp.options = { step: 600, digits: 6 };

/**
 * Generates a time-based OTP secret tied to the user's email.
 * Using email as the secret base makes it unique per user.
 * @param {string} email
 * @returns {string} 6-digit OTP token
 */

const generateOTP = (email) => {
  const secret = `${process.env.OTP_SECRET}_${email}`;
  return totp.generate(secret);
};

/**
 * Verifies the OTP token submitted by the user.
 * @param {string} email
 * @param {string} token - The OTP entered by the user
 * @returns {boolean} True if valid, false if expired or wrong
 */

const verifyOTPToken = (email, token) => {
  const secret = `${process.env.OTP_SECRET}_${email}`;
  return totp.verify({ token, secret });
};

/**
 * Sends the OTP to the user's email via Nodemailer.
 * @param {string} email
 * @param {string} otp
 */

const sendOTPEmail = async (email, otp) => {
  // Configure your SMTP transporter (Gmail example)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER, // your sending Gmail
      pass: process.env.MAIL_PASSWORD, // Gmail app password
    },
  });

  await transporter.sendMail({
    from: `"CTransit" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Verify your CTransit account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #1a3c8f;">CTransit Email Verification</h2>
        <p>Use the OTP below to verify your email address. It expires in <strong>10 minutes</strong>.</p>
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
        ">
          ${otp}
        </div>
        <p style="color: #888; font-size: 13px;">
          If you did not create a CTransit account, ignore this email.
        </p>
      </div>
    `,
  });
};

export { generateOTP, verifyOTPToken, sendOTPEmail };
