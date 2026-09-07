import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthGuard = ({ children }) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if sessionId exists in cookies
    const checkAuth = () => {
      const cookies = document.cookie.split(';');
      const sessionIdCookie = cookies.find(cookie => 
        cookie.trim().startsWith('sessionId=')
      );
      
      if (!sessionIdCookie) {
        navigate('/admin/login');
      } else {
        setIsChecking(false);
      }
    };

    // Add small delay to ensure cookie is set
    const timer = setTimeout(() => {
      checkAuth();
    }, 100);

    return () => clearTimeout(timer);
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
