import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaIdCard, FaPhone, FaUser, FaUniversity, FaUpload, FaArrowLeft } from 'react-icons/fa';

import styles from './KYC.module.css';

export default function KYC() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    matricNumber: '',
    phone: '',
    schoolId: '',
    idCardImage: null,
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleChange = (event) => {
    const { name, value, files } = event.target;

    if (name === 'idCardImage') {
      const file = files?.[0] || null;
      setFormData((previous) => ({ ...previous, idCardImage: file }));

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (file) setPreviewUrl(URL.createObjectURL(file));
      return;
    }

    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = {};
    ['firstname', 'lastname', 'matricNumber', 'phone', 'schoolId'].forEach((field) => {
      if (!formData[field].trim()) nextErrors[field] = 'Required';
    });

    if (!formData.idCardImage) nextErrors.idCardImage = 'Upload your school ID card image';

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    // Backend integration: submit KYC details and image file here.
    setSuccess(true);
    sessionStorage.setItem('authSuccessMessage', 'KYC completed successfully. Your account will be reviewed shortly.');

    setTimeout(() => navigate('/dashboard', { replace: true }), 1800);
  };

  return (
    <main className={styles.page}>
      <motion.section className={styles.card} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>
            <FaArrowLeft /> Back
          </button>
          <div>
            <span className={styles.badge}>Identity Verification</span>
            <h1>Complete Your KYC</h1>
            <p>Submit your student details and school ID card so your wallet and card tools can be unlocked.</p>
          </div>
        </div>

        {success ? (
          <div className={styles.successBox}>
            <h2>KYC submitted successfully</h2>
            <p>We’ll review your details and update your account soon.</p>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.grid}>
              <label>
                <span><FaUser /> First Name</span>
                <input name="firstname" value={formData.firstname} onChange={handleChange} placeholder="First name" />
                {errors.firstname && <small>{errors.firstname}</small>}
              </label>
              <label>
                <span><FaUser /> Last Name</span>
                <input name="lastname" value={formData.lastname} onChange={handleChange} placeholder="Last name" />
                {errors.lastname && <small>{errors.lastname}</small>}
              </label>
              <label>
                <span><FaIdCard /> Matric Number</span>
                <input name="matricNumber" value={formData.matricNumber} onChange={handleChange} placeholder="PHY/2026/154" />
                {errors.matricNumber && <small>{errors.matricNumber}</small>}
              </label>
              <label>
                <span><FaPhone /> Phone Number</span>
                <input name="phone" value={formData.phone} onChange={handleChange} placeholder="+234 801 234 5678" />
                {errors.phone && <small>{errors.phone}</small>}
              </label>
              <label>
                <span><FaUniversity /> School ID Number</span>
                <input name="schoolId" value={formData.schoolId} onChange={handleChange} placeholder="Student ID" />
                {errors.schoolId && <small>{errors.schoolId}</small>}
              </label>
              <label>
                <span><FaUpload /> School ID Card Image</span>
                <input type="file" name="idCardImage" accept="image/*" onChange={handleChange} />
                {errors.idCardImage && <small>{errors.idCardImage}</small>}
              </label>
            </div>

            <div className={styles.previewWrap}>
              <div className={styles.previewCard}>
                <h3>KYC checklist</h3>
                <ul>
                  <li>Match your matric number exactly</li>
                  <li>Use a reachable Nigerian phone number</li>
                  <li>Upload a clear school ID image</li>
                  <li>Keep your name consistent with your student record</li>
                </ul>
              </div>
              <div className={styles.previewCard}>
                <h3>Image Preview</h3>
                {previewUrl ? <img src={previewUrl} alt="ID preview" className={styles.previewImage} /> : <p>No image selected yet.</p>}
              </div>
            </div>

            <button className={styles.submitBtn} type="submit">Submit KYC</button>
          </form>
        )}
      </motion.section>
    </main>
  );
}