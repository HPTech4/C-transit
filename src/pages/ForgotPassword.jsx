import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { FaArrowLeft, FaEnvelope } from "react-icons/fa";
import { LoadingSpinner, EmailIcon } from "../components/AnimatedIcons";
import { validateEmail } from "../utils/validation";
import { USER_API_URL } from "../config/api"; // ✅ was AUTH_API_URL
import styles from "./ForgotPassword.module.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // ✅ Correct endpoint: POST /api/users/forgot-password
      await axios.post(`${USER_API_URL}/users/forgot-password`, {
        email: email.trim().toLowerCase(),
      });

      setSubmitted(true);
      setTimeout(() => {
        navigate("/password-reset-otp", {
          state: { email: email.trim().toLowerCase() },
        });
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to send reset code. Please try again."
      );
      console.error("Forgot password error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button className={styles.backBtn} onClick={() => navigate("/login")}>
        <FaArrowLeft /> Back to Login
      </button>

      <motion.div className={styles.card}>
        <div className={styles.header}>
          <FaEnvelope className={styles.icon} />
          <h1>Forgot Password?</h1>
          <p>
            Enter your email and we'll send you a code to reset your password.
          </p>
        </div>

        {submitted ? (
          <motion.div
            className={styles.successBox}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className={styles.checkmark}>✓</div>
            <h3>Check Your Email</h3>
            <p>
              We've sent a verification code to <strong>{email}</strong>
            </p>
            <p className={styles.subtitle}>Redirecting...</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <motion.div
                className={styles.errorBox}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}
            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>
              <div className={styles.inputWrapper}>
                <EmailIcon />
                <input
                  id="email"
                  type="email"
                  placeholder="your.email@st.futminna.edu.ng"
                  value={email}
                  onChange={handleChange}
                  disabled={loading}
                  className={error ? styles.invalid : ""}
                />
              </div>
            </div>
            <motion.button
              type="submit"
              disabled={loading}
              className={styles.submitBtn}
            >
              {loading ? <LoadingSpinner /> : "Send Recovery Code"}
            </motion.button>
            <div className={styles.infoBox}>
              <p>
                💡 Check your spam folder if you don't see the email within 2
                minutes.
              </p>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}
