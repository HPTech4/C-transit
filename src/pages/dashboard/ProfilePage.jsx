import { useState } from 'react';
import { FaArrowLeft, FaEdit, FaCheck, FaTimes, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import styles from './ProfilePage.module.css';

const User_API_URL = '/api';

export default function ProfilePage({ userData, onBack }) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: userData?.firstName || '',
    lastName: userData?.lastName || '',
    email: userData?.email || '',
    phoneNumber: userData?.phoneNumber || '',
    matricNumber: userData?.matricNumber || '',
    address: userData?.address || '',
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      setSaveError(null);
      const token = localStorage.getItem('authToken');
      await axios.put(`${User_API_URL}/users/myprofile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setEditMode(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      setSaveError('Failed to save changes. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form back to original userData values
    setFormData({
      firstName: userData?.firstName || '',
      lastName: userData?.lastName || '',
      email: userData?.email || '',
      phoneNumber: userData?.phoneNumber || '',
      matricNumber: userData?.matricNumber || '',
      address: userData?.address || '',
    });
    setSaveError(null);
    setEditMode(false);
  };

  return (
    <>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={onBack}>
          <FaArrowLeft size={20} />
        </button>
        <h1 className={styles.pageTitle}>Profile</h1>
        <button
          className={styles.editBtn}
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? <FaTimes size={20} /> : <FaEdit size={20} />}
        </button>
      </div>

      {/* Profile Avatar Section */}
      <div className={styles.avatarSection}>
        <div className={styles.avatar}>
          {formData.firstName?.charAt(0)}{formData.lastName?.charAt(0)}
        </div>
        <p className={styles.userInitials}>{formData.firstName} {formData.lastName}</p>
        <p className={styles.userRole}>Passenger</p>
      </div>

      {/* Profile Info Form */}
      <div className={styles.infoSection}>
        <h3 className={styles.sectionTitle}>Personal Information</h3>

        <div className={styles.formGroup}>
          <label className={styles.label}>First Name</label>
          <input
            type="text"
            className={styles.input}
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            disabled={!editMode}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Last Name</label>
          <input
            type="text"
            className={styles.input}
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            disabled={!editMode}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Email</label>
          <input
            type="email"
            className={styles.input}
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            disabled={!editMode}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Phone Number</label>
          <input
            type="tel"
            className={styles.input}
            value={formData.phoneNumber}
            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            disabled={!editMode}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Matric Number</label>
          <input
            type="text"
            className={styles.input}
            value={formData.matricNumber}
            onChange={(e) => handleInputChange('matricNumber', e.target.value)}
            disabled={!editMode}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Address</label>
          <input
            type="text"
            className={styles.input}
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            disabled={!editMode}
          />
        </div>
      </div>

      {/* Save Error Message */}
      {saveError && (
        <p className={styles.errorMessage}>{saveError}</p>
      )}

      {/* Edit Mode Actions */}
      {editMode && (
        <div className={styles.editActions}>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={saveLoading}
          >
            <FaCheck size={16} />
            {saveLoading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            className={styles.cancelBtn}
            onClick={handleCancel}
            disabled={saveLoading}
          >
            <FaTimes size={16} />
            Cancel
          </button>
        </div>
      )}

      {/* Danger Zone */}
      <div className={styles.dangerZone}>
        <h3 className={styles.dangerTitle}>Account Management</h3>
        <button className={styles.deleteAccountBtn}>
          <FaTrash size={16} />
          Delete Account
        </button>
      </div>
    </>
  );
}