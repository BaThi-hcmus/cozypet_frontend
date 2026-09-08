import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import api from '../../../api/api';
import { toast } from 'react-toastify';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/admin/auth/login', formData);
      if (response.data) {
        toast.success('Đăng nhập thành công! Đang chuyển hướng...', { autoClose: 1500 });
        setTimeout(() => {
          navigate('/admin/accounts', { replace: true });
        }, 400);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginWrapper}>
      <div className={`${styles.ambientBlob} ${styles.blob1}`}></div>
      <div className={`${styles.ambientBlob} ${styles.blob2}`}></div>
      <div className={`${styles.ambientBlob} ${styles.blob3}`}></div>

      <main className={styles.loginContainer}>
        <div className={styles.headerSection}>
          <div className={styles.logoBadge}>
            <span className="material-symbols-rounded">pets</span>
            <span>CozyPet Admin</span>
          </div>

          <h1 className={styles.loginTitle}>
            <span>Chào mừng trở lại</span>
            <span className={`material-symbols-rounded ${styles.sparkleIcon}`}>auto_awesome</span>
          </h1>

          <p className={styles.loginSubtitle}>
            Đăng nhập để quản lý hệ thống thú cưng ảo
          </p>
        </div>

        <form className={styles.loginForm} onSubmit={handleSubmit}>
          {error && (
            <div className={styles.errorMessage}>
              <span className="material-symbols-rounded">error</span>
              <span>{error}</span>
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <span className="material-symbols-rounded">email</span>
              Email
            </label>
            <input
              type="email"
              name="email"
              className={styles.formInput}
              placeholder="admin@cozypet.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <span className="material-symbols-rounded">lock</span>
              Mật khẩu
            </label>
            <input
              type="password"
              name="password"
              className={styles.formInput}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className={styles.loginButton}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="material-symbols-rounded">hourglass_empty</span>
                <span>Đang đăng nhập...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-rounded">login</span>
                <span>Đăng nhập</span>
              </>
            )}
          </button>
        </form>

        <div className={styles.footerNote}>
          <span className="material-symbols-rounded">shield</span>
          <span>Hệ thống quản trị bảo mật</span>
        </div>
      </main>
    </div>
  );
}
