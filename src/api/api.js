import axios from 'axios';

// Tạo một instance axios với cấu hình chung
const api = axios.create({
  baseURL: 'http://localhost:3000', // Thay bằng đường dẫn Backend của bạn
  timeout: 10000, // Thời gian chờ tối đa (10 giây)
  headers: {
    'Content-Type': 'application/json',
  },
});

// (Tùy chọn) Interceptor để tự động gắn Token vào header trước khi gửi request đi
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Lấy token đăng nhập nếu có
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;