import { create } from 'zustand';
import api from '../api/api';

const useAuthStore = create((set, get) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true, // ban đầu để true để chờ check refresh token

  setAccessToken: (token) => set({ accessToken: token, isAuthenticated: !!token }),
  setUser: (user) => set({ user }),

  // Đăng nhập
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { accessToken } = response.data;
      set({ accessToken, isAuthenticated: true });
      await get().fetchProfile();
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Đăng ký
  register: async (data) => {
    try {
      const response = await api.post('/auth/register', data);
      const { accessToken } = response.data;
      set({ accessToken, isAuthenticated: true });
      await get().fetchProfile();
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Lấy thông tin user (khi đã có access token)
  fetchProfile: async () => {
    try {
      const response = await api.get('/user/profile');
      set({ user: response.data.data });
    } catch (error) {
      set({ accessToken: null, user: null, isAuthenticated: false });
    }
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error', error);
    }
    set({ accessToken: null, user: null, isAuthenticated: false });
  },

  // Làm mới token khi reload trang
  checkAuth: async () => {
    try {
      set({ isLoading: true });
      // Gọi api refresh token, cookie được tự động gửi
      const response = await api.post('/auth/refresh-token');
      // The API returns accessToken directly now (or inside an object depending on what refreshToken endpoint returns, wait, let me check backend: it returns `{ accessToken }`)
      const accessToken = response.data.accessToken || response.data;
      
      if (accessToken) {
        set({ accessToken: typeof accessToken === 'string' ? accessToken : accessToken.accessToken, isAuthenticated: true });
        await get().fetchProfile();
      }
    } catch (error) {
      // Nếu lỗi refresh (hết hạn, ko có) thì reset state
      set({ accessToken: null, user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  }
}));

export default useAuthStore;
