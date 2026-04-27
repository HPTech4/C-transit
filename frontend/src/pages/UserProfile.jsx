import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaEdit, FaLock, FaPhone, FaCalendarAlt } from 'react-icons/fa';
import styles from './UserProfile.module.css';

/**
 * UserProfile Component
 * 
 * Shows user's profile information including:
 * - Profile picture (avatar)
 * - Personal info (name, email, matric number, phone)
 * - Account statistics
 * - Edit profile button
 * - Change password button
 * - Emergency contact info
 * 
 * BACKEND INTEGRATION:
 * - GET /api/user/profile (get current profile data)
 * - PUT /api/user/profile (update profile: name, phone, avatar)
 * - POST /api/user/change-password (change password)
 */
export default function UserProfile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Mock user data (replace with actual API response)
  const [userData, setUserData] = useState({
    firstname: 'Alimi',
    lastname: 'Azeez',
    email: 'alimi@campus.edu',
    matricNumber: 'PHY/2026/154',
    phone: '+234 81 XXXX XXXX',
    avatar: null,
    joinDate: 'January 2026',
  });

  // Mock profile stats
  const profileStats = {
    totalTrips: 42,
    totalSpent: 25500,
    memberSince: 'January 2026',
  };

  // BACKEND: PUT /api/user/profile
  // Send: { firstname, lastname, phone, avatar }
  // Response: { success: true, user: {...updatedUserData} }
  const handleSaveProfile = async () => {
    // TODO: Add actual API call when backend is ready
    setIsEditing(false);
  };

  // BACKEND: POST /api/user/change-password
  // Send: { currentPassword, newPassword, confirmPassword }
  // Response: { success: true, message: "Password changed" }
  const handleChangePassword = async (currentPass, newPass) => {
    // TODO: Add actual API call when backend is ready
    setShowPasswordModal(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div className={styles.profilePage} initial="hidden" animate="visible" variants={containerVariants}>
      {/* Header */}
      <div className={styles.header}>
        <motion.button className={styles.backBtn} onClick={() => navigate('/dashboard')} whileHover={{ x: -5 }}>
          <FaArrowLeft /> Back
        </motion.button>
        <h1>My Profile</h1>
      </div>

      <div className={styles.container}>
        {/* Profile Card */}
        <motion.div className={styles.profileCard} variants={itemVariants}>
          {/* Avatar Section */}
          <div className={styles.avatarSection}>
            <div className={styles.avatar}>
              {userData.avatar ? <img src={userData.avatar} alt="Profile" /> : <span>{userData.firstname[0]}</span>}
            </div>
            <div className={styles.avatarAction}>
              <motion.button className={styles.avatarBtn} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                Change Photo
              </motion.button>
            </div>
          </div>

          {/* User Info Section */}
          <div className={styles.infoSection}>
            <h2>
              {userData.firstname} {userData.lastname}
            </h2>

            {/* Info Grid */}
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Email</label>
                <p>{userData.email}</p>
              </div>
              <div className={styles.infoItem}>
                <label>Matric Number</label>
                <p>{userData.matricNumber}</p>
              </div>
              <div className={styles.infoItem}>
                <label>Phone Number</label>
                <p>{userData.phone}</p>
              </div>
              <div className={styles.infoItem}>
                <label>Member Since</label>
                <p>{userData.joinDate}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <motion.button
              className={styles.primaryBtn}
              onClick={() => setIsEditing(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FaEdit /> Edit Profile
            </motion.button>
            <motion.button
              className={styles.secondaryBtn}
              onClick={() => setShowPasswordModal(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FaLock /> Change Password
            </motion.button>
          </div>
        </motion.div>

        {/* Statistics Card */}
        <motion.div className={styles.statsCard} variants={itemVariants}>
          <h3>Account Statistics</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{profileStats.totalTrips}</div>
              <div className={styles.statLabel}>Total Trips</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>₦{profileStats.totalSpent.toLocaleString()}</div>
              <div className={styles.statLabel}>Total Spent</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{profileStats.memberSince}</div>
              <div className={styles.statLabel}>Member Since</div>
            </div>
          </div>
        </motion.div>

        {/* Emergency Contact Card */}
        <motion.div className={styles.emergencyCard} variants={itemVariants}>
          <h3>
            <FaPhone /> Emergency Contact
          </h3>
          <p className={styles.placeholder}>No emergency contact added yet</p>
          <motion.button
            className={styles.addBtn}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsEditing(true)}
          >
            Add Emergency Contact
          </motion.button>
        </motion.div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && <EditProfileModal userData={userData} setUserData={setUserData} onClose={() => setIsEditing(false)} onSave={handleSaveProfile} />}

      {/* Change Password Modal */}
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} onSubmit={handleChangePassword} />}
    </motion.div>
  );
}

/**
 * EditProfileModal - Modal for editing user profile
 * BACKEND: PUT /api/user/profile
 */
function EditProfileModal({ userData, setUserData, onClose, onSave }) {
  const [formData, setFormData] = useState(userData);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUserData(formData);
    await onSave();
  };

  return (
    <motion.div className={styles.modalOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className={styles.modal} initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
        <h2>Edit Profile</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>First Name</label>
            <input
              type="text"
              name="firstname"
              value={formData.firstname}
              onChange={handleChange}
              placeholder="First name"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Last Name</label>
            <input
              type="text"
              name="lastname"
              value={formData.lastname}
              onChange={handleChange}
              placeholder="Last name"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+234 XXX XXXX XXXX"
            />
          </div>
          <div className={styles.modalActions}>
            <motion.button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              className={styles.submitBtn}
              whileHover={{ scale: 1.02 }}
            >
              Save Changes
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/**
 * ChangePasswordModal - Modal for changing password
 * BACKEND: POST /api/user/change-password
 */
function ChangePasswordModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    await onSubmit(formData.currentPassword, formData.newPassword);
  };

  return (
    <motion.div className={styles.modalOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className={styles.modal} initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
        <h2>Change Password</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Current Password</label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              placeholder="Enter current password"
            />
          </div>
          <div className={styles.formGroup}>
            <label>New Password</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Enter new password (min 8 chars)"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
            />
          </div>
          {error && <div className={styles.errorMessage}>{error}</div>}
          <div className={styles.modalActions}>
            <motion.button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              className={styles.submitBtn}
              whileHover={{ scale: 1.02 }}
            >
              Update Password
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
