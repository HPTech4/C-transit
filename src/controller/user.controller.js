'use strict';

import { getUserCount, getAllUsers, getUserProfile, updateUserProfile, changeUserPassword, requestPasswordReset, resetPasswordWithOTP } from "../services/user.service.js";
import { generateOTP, verifyOTPToken, sendOTPEmail } from "../services/otp.service.js";
import logger from "../config/logger.js";

export const fetchUserCount = async (req, res) => {
  try {
    const count = await getUserCount();
    logger.info({ count }, 'user.count_fetched');
    res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error) {
    logger.error({ err: error.message }, 'user.fetch_count_error');
    res.status(500).json({
      success: false,
      message: "Failed to fetch user count",
    });
  }
};
export const fetchAllUsers = async (req, res) => {
  try {
    const users = await getAllUsers();
    logger.info({ userCount: users.length }, 'user.all_users_fetched');
    res.status(200).json({
      success: true,
      data: { users },
    });
  } catch (error) {
    logger.error({ err: error.message }, 'user.fetch_all_users_error');
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

export const fetchProfile = async (req, res) => {
  console.log("req.user:", req.user);
  try {
    const userId = req.user.userId;
    const profile = await getUserProfile(userId);

    logger.info({ userId }, 'user.profile_fetched');
    res.status(200).json({
      success: true,
      data: { profile },
    });
  } catch (error) {
    logger.error({ err: error.message }, 'user.fetch_profile_error');
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { firstname, lastname, phoneNumber } = req.body;

    if (!firstname && !lastname && !phoneNumber) {
      return res.status(400).json({
        success: false,
        message:
          "Provide at least one field to update: firstname, lastname, or phoneNumber",
      });
    }

    const updatedProfile = await updateUserProfile(userId, {
      firstname: firstname,
      lastname: lastname,
      phonenumber: phoneNumber,
    });

    logger.info({ userId }, 'user.profile_updated');
    res.status(200).json({
      success: true,
      message: "User profile updated successfully",
      data: { profile: updatedProfile },
    });
  } catch (error) {
    logger.error({ err: error.message }, 'user.update_profile_error');
    res.status(500).json({
      success: false,
      message: "Failed to update user profile",
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Both currentPassword and newPassword are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long",
      });
    }

    await changeUserPassword(userId, currentPassword, newPassword);

    logger.info({ userId }, "user.password_changed");
    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    logger.error({ err: error.message }, "user.change_password_error");

    const knownErrors = [
      "Current password is incorrect",
      "New password must be different from current password",
      "User not found",
    ];

    const isKnown = knownErrors.includes(error.message);
    res.status(isKnown ? 400 : 500).json({
      success: false,
      message: isKnown ? error.message : "Failed to change password",
    });
  }
};

export const requestForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Verify account exists (Step 1: Account Verification)
    await requestPasswordReset(email.toLowerCase());

    // Generate and send OTP (Step 2: Email Verification)
    const otp = generateOTP(email.toLowerCase());
    await sendOTPEmail(email.toLowerCase(), otp);

    logger.info({ email: email.toLowerCase() }, "user.forgot_password_otp_sent");
    res.status(200).json({
      success: true,
      message: "An OTP has been sent to your email. Please verify your email to reset your password.",
    });
  } catch (error) {
    logger.error({ err: error.message }, "user.forgot_password_request_error");

    // Don't reveal if account exists or not for security
    if (error.message === "No account found with this email") {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to process password reset request",
    });
  }
};

export const resetForgotPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    // Verify OTP (Email Verification)
    const isValidOtp = verifyOTPToken(email.toLowerCase(), otp);
    if (!isValidOtp) {
      logger.warn({ email: email.toLowerCase() }, "user.forgot_password_invalid_otp");
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP. Please request a new one.",
      });
    }

    // Reset password
    await resetPasswordWithOTP(email.toLowerCase(), newPassword);

    logger.info({ email: email.toLowerCase() }, "user.password_reset_successfully");
    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    logger.error({ err: error.message }, "user.reset_password_error");

    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to reset password",
    });
  }
};