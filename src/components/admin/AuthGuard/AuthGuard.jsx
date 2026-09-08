import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/api';

const AuthGuard = ({ children }) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const abortController = new AbortController();

    const checkAuth = async () => {
      try {
        const res = await api.get('/admin/auth/profile', {
          signal: abortController.signal,
          timeout: 8000
        });

        if (res.data?.data?._id) {
          setIsChecking(false);
        } else {
          navigate('/admin/login', { replace: true });
        }
      } catch (err) {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED' || err.name === 'CanceledError') {
          return;
        }
        navigate('/admin/login', { replace: true });
      }
    };

    checkAuth();

    return () => abortController.abort();
  }, [navigate]);

  if (isChecking) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '16px',
        color: '#6b5f59'
      }}>
        Đang kiểm tra đăng nhập...
      </div>
    );
  }

  return children;
};

export default AuthGuard;
