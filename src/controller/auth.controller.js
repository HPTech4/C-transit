import prisma from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import logger from "../config/logger.js";
import env from "../config/env.js";
import {
  generateOTP,
  verifyOTPToken,
  sendOTPEmail,
} from "../services/otp.service.js";

const isValidInstitutionEmail = (email) => {
  return email.toLowerCase().endsWith(env.auth.allowedEmailDomain);
};

const isValidPassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

export const registerStudent = async (req, res) => {
  try {
    const { firstname, lastname, email, matricNumber, password } = req.body;
    if (!firstname || !lastname || !email || !matricNumber || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters and contain uppercase, lowercase, and numbers",
      });
    }
    if (!isValidInstitutionEmail(email)) {
      return res.status(400).json({
        message: `Only ${env.auth.allowedEmailDomain} email addresses are accepted`,
      });
    }
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email.toLowerCase() }, { matricNumber }],
      },
    });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        firstname,
        lastname,
        email: email.toLowerCase(),
        matricNumber: matricNumber.toUpperCase(),
        password: hashedPassword,
        role: "STUDENT",
        isVerified: false,
      },
    });
    const otp = generateOTP(email.toLowerCase());
    await sendOTPEmail(email.toLowerCase(), otp);
    logger.info({ email: email.toLowerCase() }, 'auth.registration_successful_otp_sent');
    res.status(201).json({
      message: "Registration successful. Check your email for the OTP.",
    });
  } catch (error) {
    logger.error({ err: error.message }, 'auth.registration_error');
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      logger.warn({ email: email.toLowerCase() }, 'auth.verify_otp_user_not_found');
      return res.status(404).json({ message: "User not found" });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }
    const isValid = verifyOTPToken(email.toLowerCase(), otp);
    if (!isValid) {
      logger.warn({ email: email.toLowerCase() }, 'auth.verify_otp_invalid_or_expired');
      return res.status(400).json({
        message: "Invalid or expired OTP. Please request a new one.",
      });
    }
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { isVerified: true },
    });
    logger.info({ email: email.toLowerCase() }, 'auth.otp_verified_successfully');
    res.status(200).json({
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    logger.error({ err: error.message }, 'auth.verify_otp_error');
    res.status(500).json({ message: "Server error" });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      logger.warn({ email: email.toLowerCase() }, 'auth.resend_otp_user_not_found');
      return res.status(404).json({ message: "User not found" });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }
    const otp = generateOTP(email.toLowerCase());
    await sendOTPEmail(email.toLowerCase(), otp);
    logger.info({ email: email.toLowerCase() }, 'auth.otp_resent');
    res.status(200).json({ message: "A new OTP has been sent to your email" });
  } catch (error) {
    logger.error({ err: error.message }, 'auth.resend_otp_error');
    res.status(500).json({ message: "Server error" });
  }
};

export const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide email and password",
      });
    }
    if (!isValidInstitutionEmail(email)) {
      return res.status(400).json({
        message: `Only ${env.auth.allowedEmailDomain} email addresses are accepted`,
      });
    }
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      logger.warn({ email: email.toLowerCase() }, 'auth.login_user_not_found');
      return res.status(400).json({ message: "Invalid email or password" });
    }
    if (!user.isVerified) {
      logger.warn({ email: email.toLowerCase() }, 'auth.login_email_not_verified');
      return res.status(403).json({
        message: "Email not verified. Please check your email for the OTP.",
      });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      logger.warn({ email: email.toLowerCase() }, 'auth.login_invalid_password');
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      env.jwt.secret,
      { expiresIn: "1h" }
    );
    logger.info({ email: email.toLowerCase(), userId: user.id }, 'auth.login_successful');
    res.status(200).json({
      token,
      message: "Login successful",
    });
  } catch (error) {
    logger.error({ err: error.message }, 'auth.login_error');
    res.status(500).json({ message: "Server error" });
  }
};
