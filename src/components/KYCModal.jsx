import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaIdCard,
  FaUpload,
  FaCheckCircle,
  FaTimes,
  FaArrowRight,
} from "react-icons/fa";
import { KYC_API_URL } from "../config/api";
import styles from "./KYCModal.module.css";

export default function KYCModal({ onClose }) {
  const [step, setStep] = useState(1); // Step 1: Upload, Step 2: Review
  const [idCardImage, setIdCardImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [extractedData, setExtractedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setError("");
    setIdCardImage(file);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleContinue = async () => {
    const token = localStorage.getItem("token");
    console.log("=== KYC DEBUG ===");
    console.log("1. Raw token:", token);
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const expiry = new Date(payload.exp * 1000);
        console.log("2. Token payload:", payload);
        console.log("3. Expires at:", expiry.toLocaleString());
        console.log("4. Expired?", expiry < new Date() ? "YES ❌" : "NO ✅");
      } catch (e) {
        console.log("2. Token is MALFORMED ❌", e.message);
      }
    }
    console.log("=== END DEBUG ===");
    if (!idCardImage) {
      setError("Please upload your school ID card");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("idCard", idCardImage); //  was 'idCardImage' — must match multer field name

      // Correct endpoint: POST /api/kyc/upload
      const response = await fetch(`${KYC_API_URL}/upload`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          //  Do NOT set Content-Type for FormData — browser sets it with boundary
        },
      });

     const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to process ID card");
      }

      //  Backend returns { message, data: { studentName, studentId, matricNumber, school, department, idCardImageUrl, faceImageUrl } }
      const data = result.data;
      if (!data || !data.studentName || !data.studentId) {
        throw new Error("We couldn't read your ID card clearly. Please try a clearer photo.");
      }

      setExtractedData(data);
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to process ID card. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setProcessing(true);
    setError("");

    try {
      //  Correct endpoint: POST /api/kyc/submit
      // Backend expects JSON not FormData
      const response = await fetch(`${KYC_API_URL}/submit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json", //  JSON body
        },
        body: JSON.stringify({
          studentName: extractedData.studentName,
          studentId: extractedData.studentId,
          matricNumber: extractedData.matricNumber,
          school: extractedData.school,
          department: extractedData.department,
          phoneNumber: extractedData.phoneNumber || "",
          idCardImageUrl: extractedData.idCardImageUrl,
          faceImageUrl: extractedData.faceImageUrl || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to submit KYC");
      }

      onClose({
        success: true,
        message:
          "KYC submitted successfully. Your information is under review.",
      });
    } catch (err) {
      setError(err.message || "Failed to submit KYC. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setExtractedData(null);
    } else {
      onClose();
    }
  };

  return (
    <motion.div
      className={styles.modalOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.modal}
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <div>
            <span className={styles.badge}>
              <FaIdCard /> {step === 1 ? "Upload School ID" : "Verify Details"}
            </span>
            <h2>
              {step === 1
                ? "Upload Your School ID Card"
                : "Verify Your Information"}
            </h2>
            <p>
              {step === 1
                ? "Upload a clear image of your school ID card for verification"
                : "Review the information extracted from your ID card"}
            </p>
          </div>
          <button className={styles.closeBtn} onClick={() => onClose()}>
            <FaTimes />
          </button>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              className={styles.errorBox}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className={styles.content}>
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className={styles.uploadBox}>
                  {previewUrl ? (
                    <motion.div
                      className={styles.previewContainer}
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                    >
                      <img
                        src={previewUrl}
                        alt="School ID Card"
                        className={styles.previewImage}
                      />
                      <button
                        className={styles.changeBtn}
                        onClick={() =>
                          document.getElementById("idCardInput").click()
                        }
                      >
                        Change Image
                      </button>
                    </motion.div>
                  ) : (
                    <motion.label
                      htmlFor="idCardInput"
                      className={styles.uploadLabel}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FaUpload />
                      <span>Click to upload or drag and drop</span>
                      <small>PNG, JPG, GIF up to 5MB</small>
                    </motion.label>
                  )}
                  <input
                    id="idCardInput"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className={styles.fileInput}
                  />
                </div>

                <div className={styles.instructions}>
                  <h4>Guidelines:</h4>
                  <ul>
                    <li>Ensure the entire ID card is visible</li>
                    <li>Use good lighting and clear focus</li>
                    <li>Avoid glare and shadows</li>
                    <li>File should be JPG, PNG, or GIF</li>
                  </ul>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                className={styles.reviewContainer}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className={styles.reviewGrid}>
                  {/* Left: ID Card Image */}
                  <div className={styles.imageSection}>
                    <h4>Your ID Card</h4>
                    <div className={styles.reviewImage}>
                      <img src={previewUrl} alt="School ID Card" />
                    </div>
                  </div>

                  {/* Right: Extracted Details */}
                  {/* Right: Extracted Details */}
                  <div className={styles.detailsSection}>
                    <h4>Extracted Information</h4>
                    <div className={styles.detailsGrid}>
                      <div className={styles.detailItem}>
                        <label>Full Name</label>
                        <p>{extractedData?.studentName}</p>
                      </div>
                      <div className={styles.detailItem}>
                        <label>Matric Number</label>
                        <p>{extractedData?.matricNumber}</p>
                      </div>
                      <div className={styles.detailItem}>
                        <label>Student ID</label>
                        <p>{extractedData?.studentId}</p>
                      </div>
                      <div className={styles.detailItem}>
                        <label>School</label>
                        <p>{extractedData?.school}</p>
                      </div>
                      {extractedData?.faceImageUrl && (
                        <div className={styles.detailItem}>
                          <label>Photo</label>
                          <div className={styles.photoBadge}>✓ Detected</div>
                        </div>
                      )}
                    </div>

                    <div className={styles.warningBox}>
                      <p>
                        <strong>Note:</strong> Please review the extracted
                        information carefully. If there are any errors, please
                        upload a clearer image.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <motion.button
            className={styles.cancelBtn}
            onClick={handleBack}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {step === 1 ? "Cancel" : "Back"}
          </motion.button>

          {step === 1 ? (
            <motion.button
              className={styles.primaryBtn}
              onClick={handleContinue}
              disabled={loading || !idCardImage}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                "Processing..."
              ) : (
                <>
                  Continue <FaArrowRight />
                </>
              )}
            </motion.button>
          ) : (
            <motion.button
              className={styles.primaryBtn}
              onClick={handleConfirm}
              disabled={processing}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {processing ? (
                "Submitting..."
              ) : (
                <>
                  <FaCheckCircle /> Confirm & Submit
                </>
              )}
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
