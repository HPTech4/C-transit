import prisma from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  generateOTP,
  verifyOTPToken,
  sendOTPEmail,
} from "../services/otp.service.js";
import "dotenv/config";

// Allowed email domain for registration and login
const ALLOWED_EMAIL_DOMAIN = "@st.futminna.edu.ng";

// Helper function to validate institutional email addresses
const isValidInstitutionEmail = (email) => {
  return email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN);
};

// STEP 1 — Register Student
export const registerStudent = async (req, res) => {
  try {
    const { firstname, lastname, email, matricNumber, password } = req.body;

    // Validate all fields are present
    if (!firstname || !lastname || !email || !matricNumber || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Block non-institution emails
    if (!isValidInstitutionEmail(email)) {
      return res.status(400).json({
        message: "Only institution email addresses are accepted",
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email.toLowerCase() }, { matricNumber }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user 
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

    // Generate and send OTP
    const otp = generateOTP(email.toLowerCase());
    await sendOTPEmail(email.toLowerCase(), otp);

    res.status(201).json({
      message: "Registration successful. Check your email for the OTP.",
    });
  } catch (error) {
    console.error("[registerStudent] Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// STEP 2a — Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Already verified — no need to check again
    if (user.isVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // Validate the OTP token
    const isValid = verifyOTPToken(email.toLowerCase(), otp);

    if (!isValid) {
      return res.status(400).json({
        message: "Invalid or expired OTP. Please request a new one.",
      });
    }

    // Mark user as verified in the database
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { isVerified: true },
    });

    res.status(200).json({
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    console.error("[verifyOTP] Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// STEP 2b — Resend OTP
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
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    // Generate a fresh OTP and resend
    const otp = generateOTP(email.toLowerCase());
    await sendOTPEmail(email.toLowerCase(), otp);

    res.status(200).json({ message: "A new OTP has been sent to your email" });
  } catch (error) {
    console.error("[resendOTP] Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// STEP 3 — Login Student
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
        message: "Only @st.futminna.edu.ng email addresses are accepted",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Email not verified. Please check your email for the OTP.",
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      token,
      message: "Login successful",
    });
  } catch (error) {
    console.error("[loginStudent] Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
