import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Base URL for the API
// Use your computer's IP address instead of localhost for device testing
const BASE_URL = 'http://172.26.0.213:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
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
      // You might want to redirect to login screen here
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  // Register user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Verify token
  verifyToken: async () => {
    const response = await api.post('/auth/verify-token');
    return response.data;
  },
};

// User API
export const userAPI = {
  // Get user profile
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  // Get dashboard data
  getDashboard: async () => {
    const response = await api.get('/users/dashboard');
    return response.data;
  },

  // Get user history
  getHistory: async (page = 1, limit = 5) => {
    const response = await api.get(`/users/history?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get earnings (for delivery agents)
  getEarnings: async () => {
    const response = await api.get('/users/earnings');
    return response.data;
  },

  // Update online status (for delivery agents)
  updateOnlineStatus: async (isOnline) => {
    const response = await api.put('/users/online-status', { isOnline });
    return response.data;
  },
};

// Pickup API
export const pickupAPI = {
  // Create pickup request
  createPickup: async (pickupData) => {
    const response = await api.post('/pickups', pickupData);
    return response.data;
  },

  // Get available pickups (for delivery agents)
  getAvailablePickups: async () => {
    const response = await api.get('/pickups/available');
    return response.data;
  },

  // Accept pickup request
  acceptPickup: async (pickupId) => {
    const response = await api.put(`/pickups/${pickupId}/accept`);
    return response.data;
  },

  // Reject pickup request
  rejectPickup: async (pickupId) => {
    const response = await api.put(`/pickups/${pickupId}/reject`);
    return response.data;
  },

  // Update pickup status
  updatePickupStatus: async (pickupId, status, location, notes, distanceKm) => {
    const response = await api.put(`/pickups/${pickupId}/status`, {
      status,
      location,
      notes,
      distanceKm,
    });
    return response.data;
  },

  // Rate pickup
  ratePickup: async (pickupId, rating, review) => {
    const response = await api.post(`/pickups/${pickupId}/rate`, {
      rating,
      review,
    });
    return response.data;
  },

  // Get pickup details
  getPickupDetails: async (pickupId) => {
    const response = await api.get(`/pickups/${pickupId}`);
    return response.data;
  },

  // Schedule pickup after admin approval
  schedulePickup: async (pickupId, scheduledDate, scheduledTime) => {
    const response = await api.put(`/pickups/${pickupId}/schedule`, {
      scheduledDate,
      scheduledTime,
    });
    return response.data;
  },

  // Get user pickups
  getUserPickups: async (status = 'all') => {
    const response = await api.get(`/pickups/user?status=${status}`);
    return response.data;
  },
};

// Address API
export const addressAPI = {
  // Get user addresses
  getAddresses: async () => {
    const response = await api.get('/addresses');
    return response.data;
  },

  // Create new address
  createAddress: async (addressData) => {
    const response = await api.post('/addresses', addressData);
    return response.data;
  },

  // Update address
  updateAddress: async (addressId, addressData) => {
    const response = await api.put(`/addresses/${addressId}`, addressData);
    return response.data;
  },

  // Delete address
  deleteAddress: async (addressId) => {
    const response = await api.delete(`/addresses/${addressId}`);
    return response.data;
  },

  // Set default address
  setDefaultAddress: async (addressId) => {
    const response = await api.put(`/addresses/${addressId}/default`);
    return response.data;
  },

  // Geocode coordinates to address
  geocodeAddress: async (latitude, longitude) => {
    const response = await api.post('/addresses/geocode', {
      latitude,
      longitude,
    });
    return response.data;
  },
};

// Reward API
export const rewardAPI = {
  // Get user rewards
  getRewards: async (page = 1, limit = 10, status = 'all') => {
    const response = await api.get(`/rewards?page=${page}&limit=${limit}&status=${status}`);
    return response.data;
  },

  // Redeem reward
  redeemReward: async (rewardId) => {
    const response = await api.put(`/rewards/${rewardId}/redeem`);
    return response.data;
  },

  // Get reward statistics
  getRewardStats: async () => {
    const response = await api.get('/rewards/stats');
    return response.data;
  },
};

// Delivery API
export const deliveryAPI = {
  // Get available pickups
  getAvailablePickups: async () => {
    const response = await api.get('/deliveries/available');
    return response.data;
  },

  // Get my pickups
  getMyPickups: async (status = 'all') => {
    const response = await api.get(`/deliveries/my-pickups?status=${status}`);
    return response.data;
  },

  // Update online status
  updateOnlineStatus: async (isOnline) => {
    const response = await api.put('/deliveries/online-status', { isOnline });
    return response.data;
  },

  // Get earnings
  getEarnings: async () => {
    const response = await api.get('/deliveries/earnings');
    return response.data;
  },

  // Request withdrawal
  requestWithdrawal: async (amount, paymentMethod, paymentDetails) => {
    const response = await api.post('/deliveries/withdraw', {
      amount,
      paymentMethod,
      paymentDetails,
    });
    return response.data;
  },

  // Accept pickup
  acceptPickup: async (pickupId) => {
    const response = await api.put(`/pickups/${pickupId}/accept`);
    return response.data;
  },

  // Reject pickup
  rejectPickup: async (pickupId) => {
    const response = await api.post(`/pickups/${pickupId}/reject`);
    return response.data;
  },

  // Update pickup status
  updatePickupStatus: async (pickupId, status, location) => {
    const response = await api.put(`/pickups/${pickupId}/status`, {
      status,
      location
    });
    return response.data;
  },

  // Submit waste to warehouse
  submitWaste: async (submissionData) => {
    const response = await api.post('/deliveries/submit-waste', submissionData);
    return response.data;
  },
};

// Upload API
export const uploadAPI = {
  // Upload single image
  uploadImage: async (imageUri) => {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'image.jpg',
    });

    const response = await api.post('/uploads/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Upload multiple images
  uploadMultipleImages: async (imageUris) => {
    const formData = new FormData();
    imageUris.forEach((uri, index) => {
      formData.append('images', {
        uri: uri,
        type: 'image/jpeg',
        name: `image_${index}.jpg`,
      });
    });

    const response = await api.post('/uploads/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Upload delivery documents
  uploadDocument: async (documentUri, documentType) => {
    const formData = new FormData();
    formData.append('document', {
      uri: documentUri,
      type: 'image/jpeg',
      name: 'document.jpg',
    });
    formData.append('documentType', documentType);

    const response = await api.post('/uploads/delivery-documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete uploaded image
  deleteImage: async (publicId) => {
    const response = await api.delete(`/uploads/${publicId}`);
    return response.data;
  },
};

// Utility functions
export const apiUtils = {
  // Store auth data
  storeAuthData: async (token, userData) => {
    try {
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  },

  // Get stored auth data
  getStoredAuthData: async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      return {
        token,
        userData: userData ? JSON.parse(userData) : null,
      };
    } catch (error) {
      console.error('Error getting stored auth data:', error);
      return { token: null, userData: null };
    }
  },

  // Clear auth data
  clearAuthData: async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  },

  // Handle API errors
  handleError: (error) => {
    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data?.message || 'An error occurred',
        status: error.response.status,
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        message: 'Network error. Please check your connection.',
        status: 0,
      };
    } else {
      // Something else happened
      return {
        message: error.message || 'An unexpected error occurred',
        status: 0,
      };
    }
  },
};

export default api;
