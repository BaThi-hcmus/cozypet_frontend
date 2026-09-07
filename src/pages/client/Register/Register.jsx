import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuthStore from '../../../stores/useAuthStore';
import styles from './Register.module.css'; // Sẽ dùng chung nhiều style từ Login.css nếu muốn, nhưng cứ tách ra cho dễ quản lý
import loginStyles from '../Login/Login.module.css';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuthStore();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.password) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    try {
      setLoading(true);
      await register(formData);
      toast.success('Đăng ký thành công!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={loginStyles['client-login-container']}>
      <div className={loginStyles['client-login-card']}>
        <div className={loginStyles['client-login-header']}>
          <span className={`material-symbols-outlined ${loginStyles['client-login-icon']}`}>favorite</span>
          <h2>Tạo tài khoản mới</h2>
          <p>Gia nhập thế giới CozyPet ngay hôm nay</p>
        </div>

        <form onSubmit={handleSubmit} className={loginStyles['client-login-form']}>
          <div className={loginStyles['form-group']}>
            <label>Họ và tên</label>
            <div className={loginStyles['input-with-icon']}>
              <span className="material-symbols-outlined">person</span>
              <input 
                type="text" 
                name="fullName" 
                placeholder="Nhập họ tên của bạn" 
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={loginStyles['form-group']}>
            <label>Email</label>
            <div className={loginStyles['input-with-icon']}>
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

          <div className={loginStyles['form-group']}>
            <label>Mật khẩu</label>
            <div className={loginStyles['input-with-icon']}>
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

          <button type="submit" className={loginStyles['client-btn-submit']} disabled={loading}>
            {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </button>
        </form>

        <div className={loginStyles['client-login-footer']}>
          <p>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
