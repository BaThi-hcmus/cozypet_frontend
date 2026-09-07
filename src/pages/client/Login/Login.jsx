import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuthStore from '../../../stores/useAuthStore';
import styles from './Login.module.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    try {
      setLoading(true);
      await login(formData);
      toast.success('Đăng nhập thành công!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles['client-login-container']}>
      <div className={styles['client-login-card']}>
        <div className={styles['client-login-header']}>
          <span className={`material-symbols-outlined ${styles['client-login-icon']}`}>pets</span>
          <h2>Chào mừng trở lại!</h2>
          <p>Đăng nhập để gặp lại thú cưng của bạn</p>
        </div>

        <form onSubmit={handleSubmit} className={styles['client-login-form']}>
          <div className={styles['form-group']}>
            <label>Email</label>
            <div className={styles['input-with-icon']}>
              <span className="material-symbols-outlined">mail</span>
              <input 
                type="email" 
                name="email" 
                placeholder="Nhập email của bạn" 
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles['form-group']}>
            <label>Mật khẩu</label>
            <div className={styles['input-with-icon']}>
              <span className="material-symbols-outlined">lock</span>
              <input 
                type="password" 
                name="password" 
                placeholder="Nhập mật khẩu" 
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <button type="submit" className={styles['client-btn-submit']} disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className={styles['client-login-footer']}>
          <p>Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
