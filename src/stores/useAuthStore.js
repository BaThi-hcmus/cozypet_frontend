import { create } from 'zustand';
import api from '../api/api';

const useAuthStore = create((set, get) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true, // ban đầu để true để chờ check refresh token
  currentPet: null, // lưu thông tin pet hiện tại của user
  hasPet: false, // flag để biết user đã có pet chưa

  setAccessToken: (token) => set({ accessToken: token, isAuthenticated: !!token }),
  setUser: (user) => set({ user }),
  setCurrentPet: (pet) => set({ currentPet: pet, hasPet: !!pet }),

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
        // Sau khi fetch profile thành công, kiểm tra xem user có pet chưa
        await get().fetchCurrentPet();
      }
    } catch (error) {
      // Nếu lỗi refresh (hết hạn, ko có) thì reset state
      set({ accessToken: null, user: null, isAuthenticated: false, currentPet: null, hasPet: false });
    } finally {
      set({ isLoading: false });
    }
  },

  // Lấy thông tin pet hiện tại của user
  fetchCurrentPet: async () => {
    try {
      const response = await api.get('/pets/my-current-pet');
      const { pet, petTemplate } = response.data;
      set({ currentPet: { pet, petTemplate }, hasPet: true });
    } catch (error) {
      // Nếu lỗi (404 - không có pet, hoặc lỗi khác) thì reset pet state
      set({ currentPet: null, hasPet: false });
    }
  },

  // Refresh lại pet data (gọi sau khi tạo pet mới)
  refreshPetData: async () => {
    await get().fetchCurrentPet();
  }
}));

export default useAuthStore;
