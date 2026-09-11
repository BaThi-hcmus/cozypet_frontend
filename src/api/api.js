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

// Hàng đợi lưu trữ các request đang chờ refresh token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor để tự động refresh token ngầm khi gặp lỗi 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Tránh lặp vô hạn nếu chính api refresh-token bị lỗi 401 hoặc request đã được thử lại
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/refresh-token') &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/register')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post('http://localhost:3000/auth/refresh-token', {}, { withCredentials: true });
        const newTokenData = response.data.accessToken || response.data;
        const newAccessToken = typeof newTokenData === 'string' ? newTokenData : newTokenData.accessToken;

        useAuthStore.getState().setAccessToken(newAccessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        
        processQueue(null, newAccessToken);
        isRefreshing = false;

        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        // Nếu refresh token cũng hết hạn/không hợp lệ, đăng xuất ngầm user
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;