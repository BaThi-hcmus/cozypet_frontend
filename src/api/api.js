import axios from 'axios';

import useAuthStore from '../stores/useAuthStore';

// Tạo một instance axios với cấu hình chung
const api = axios.create({
  baseURL: 'http://localhost:3000', // Thay bằng đường dẫn Backend của bạn
  timeout: 60000, // Tăng lên 60 giây để chờ upload Cloudinary và AI Gemini xử lý
  // Không set Content-Type mặc định để axios tự xử lý FormData cho file upload
  withCredentials: true
});

// Interceptor để tự động gắn Token vào header trước khi gửi request đi
api.interceptors.request.use(
  (config) => {
    // Lấy token từ Zustand thay vì localStorage
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;