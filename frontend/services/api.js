import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use real backend - no dummy data
export const USE_DUMMY = false;
const api = axios.create({
  baseURL: 'http://10.183.135.241:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`
      });
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    });

    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },

  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },

  verifyToken: async () => {
    const res = await api.post('/auth/verify-token');
    return res.data;
  }
};

export const userService = {
  me: async (token) => {
    const res = await api.get('/users/profile', { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
  },

  updateProfile: async (profileData) => {
    const res = await api.put('/users/profile', profileData);
    return res.data;
  },

  getDashboard: async () => {
    const res = await api.get('/users/dashboard');
    return res.data;
  }
};

export const wasteService = {
  listForUser: async (userId) => {
    const res = await api.get(`/waste/user/${userId}`);
    return res.data;
  },

  submit: async (payload) => {
    const res = await api.post('/waste/upload', payload);
    return res.data;
  }
};

export const couponService = {
  listForUser: async (userId) => {
    const res = await api.get(`/coupons/user/${userId}`);
    return res.data;
  },

  redeem: async (couponId) => {
    const res = await api.post(`/coupons/redeem/${couponId}`);
    return res.data;
  }
};
