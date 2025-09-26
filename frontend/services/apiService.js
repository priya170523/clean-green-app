import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Base URL for the API
// For Android emulator: use 10.0.2.2 to access host localhost
// For physical device: use host machine's WiFi IP (run `ipconfig` to find it, e.g., 192.168.x.x)
// For iOS simulator: use localhost
// Note: Update this IP to match your host machine's IP accessible from your device/emulator
const BASE_URL = 'http://10.183.135.241:5000/api'; // WiFi IP for physical device

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
  },
  // Add retry configuration
  maxRetries: 3,
  retryDelay: 1000,
  // Validate SSL certificates
  validateStatus: function (status) {
    return status >= 200 && status < 500; // Handle all 2xx and 4xx responses
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

      // Don't override multipart/form-data content type
      if (config.headers['Content-Type'] === 'multipart/form-data') {
        delete config.headers['Content-Type'];
      }

      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        headers: config.headers,
        data: config.data
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

// Valid pickup statuses
const VALID_PICKUP_STATUSES = [
  'pending',
  'awaiting_agent',
  'accepted',
  'in_progress',
  'completed',
  'cancelled'
];

// Rate limiting configuration
const RATE_LIMIT_RESET_TIME = 60000; // 1 minute
let requestCount = 0;
let lastResetTime = Date.now();

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.log('Intercepting error:', {
      message: error.message,
      code: error.code,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL
      }
    });

    // Reset rate limit counter if enough time has passed
    const now = Date.now();
    if (now - lastResetTime >= RATE_LIMIT_RESET_TIME) {
      requestCount = 0;
      lastResetTime = now;
    }

    // Handle network errors with retry
    if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
      const config = error.config;
      if (!config || !config.retry) {
        config.retry = 0;
      }

      if (config.retry < 3) {
        config.retry += 1;
        const delay = config.retry * 1000; // Progressive delay
        console.log(`Retrying request (${config.retry}/3) after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return api(config);
      }
    }

    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = parseInt(error.response.headers['retry-after']) || 60;
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return api.request(error.config);
    }

    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    });

    // Retry logic for 429 Too Many Requests
    if (error.response?.status === 429) {
      const config = error.config;
      if (!config.__retryCount) {
        config.__retryCount = 0;
      }

      if (config.__retryCount >= 3) {
        // Reject after 3 retries
        return Promise.reject(error);
      }

      config.__retryCount += 1;

      // Exponential backoff delay
      const delay = Math.pow(2, config.__retryCount) * 1000;

      await new Promise(resolve => setTimeout(resolve, delay));

      return api(config);
    }

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
    try {
      console.log('Attempting login to:', `${BASE_URL}/auth/login`);
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Login request failed:', {
        message: error.message,
        code: error.code,
        isAxiosError: error.isAxiosError,
        status: error.response?.status,
        serverError: error.response?.data
      });
      
      // Check if server is reachable
      try {
        await api.get('/health');
      } catch (healthError) {
        console.error('Server health check failed:', healthError.message);
        throw new Error('Server appears to be offline. Please try again later.');
      }
      
      throw error;
    }
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

  // Update user progress after delivery (for spin)
  updateProgress: async (pickupId, weight) => {
    const response = await api.post('/progress/update', { pickupId, weight });
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

  // Upload pickup photo
  uploadPickupPhoto: async (pickupId, formData) => {
    try {
      // Get auth token
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No auth token found');
      }

      console.log('Uploading pickup photo with fetch:', { pickupId });

      const response = await fetch(`${BASE_URL}/pickups/${pickupId}/photo`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
          // Do not set Content-Type; let browser/fetch set it with boundary
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Pickup photo upload successful:', data);
      return data;
    } catch (error) {
      console.error('Fetch upload pickup photo error:', error);
      throw error;
    }
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

  // Get user progress
  getProgress: async () => {
    const response = await api.get('/progress');
    return response.data;
  },

  // Claim wheel reward
  claimWheelReward: async (result) => {
    const response = await api.post('/progress/wheel-reward', { result });
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
    const response = await api.get('/delivery/earnings');
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
    try {
      // Get auth token
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No auth token found');
      }

      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg', // Fallback; actual type may vary (e.g., image/png)
        name: 'image.jpg',
      });

      console.log('Uploading image with fetch:', { uri: imageUri });

      const response = await fetch(`${BASE_URL}/uploads/image`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
          // Do not set Content-Type; let browser/fetch set it with boundary
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Upload successful:', data);
      return data;
    } catch (error) {
      console.error('Fetch upload error:', error);
      throw error;
    }
  },

  // Upload multiple images
  uploadMultipleImages: async (imageUris) => {
    const formData = new FormData();
    imageUris.forEach((uri, index) => {
      formData.append('images', {
        uri: uri,
        type: 'image/jpeg', // Fallback; actual type may vary
        name: `image_${index}.jpg`,
      });
    });

    // Let Axios auto-set Content-Type with boundary
    const response = await api.post('/uploads/multiple', formData);
    return response.data;
  },

  // Upload delivery documents
  uploadDocument: async (documentUri, documentType) => {
    const formData = new FormData();
    formData.append('document', {
      uri: documentUri,
      type: 'image/jpeg', // Adjust if documents can be PDF/other
      name: 'document.jpg',
    });
    formData.append('documentType', documentType);

    // Let Axios auto-set Content-Type with boundary
    const response = await api.post('/uploads/delivery-documents', formData);
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
