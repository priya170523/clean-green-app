import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Base URL for the API
const BASE_URL = 'http://172.26.0.213:5000/api'; // WiFi IP for physical device

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // Increased timeout for uploads
  headers: {
    'Content-Type': 'application/json',
  },
  // Retry configuration
  retry: 3,
  retryDelay: (retryCount) => retryCount * 1000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

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

// Retry utility function
const retryUpload = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1 || (error.name !== 'AbortError' && error.message !== 'Network Error')) {
        throw error;
      }
      console.log(`Upload attempt ${i + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
};

// Upload API functions
export const uploadAPI = {
  // Upload delivery documents to Cloudinary via backend
  uploadDocument: async (documentUri, documentType) => {
    try {
      // Get auth token first
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No auth token found');
      }

      // Create form data with optimized settings
      const formData = new FormData();

      formData.append('image', {
        uri: documentUri,
        type: 'image/jpeg',
        name: 'image.jpg',
      });

      console.log('Uploading document:', {
        type: documentType,
        uri: documentUri
      });

      // Upload using optimized fetch settings with retry
      const uploadFn = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // Increased to 120 second timeout

        const response = await fetch(`${BASE_URL}/uploads/image`, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          signal: controller.signal,
          keepalive: true,
          mode: 'cors',
          credentials: 'omit'
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Upload failed with status: ${response.status}`);
        }

        return response;
      };

      const response = await retryUpload(uploadFn, 3, 2000);

      const data = await response.json();

      console.log('Upload successful:', {
        status: response.status,
        size: response.headers.get('content-length'),
        type: response.headers.get('content-type'),
        data: data
      });

      // Update backend about the uploaded document
      const documentInfoResponse = await api.post('/uploads/document-info', {
        documentType,
        cloudinaryUrl: data.data ? data.data.url : data.url, // handle nested data
        publicId: data.data ? data.data.publicId : data.publicId
      });

      if (!documentInfoResponse.data.success) {
        console.error('Document info update error:', documentInfoResponse.data);
        throw new Error(documentInfoResponse.data.message || 'Failed to update document info');
      }

      return {
        success: true,
        data: {
          url: data.data ? data.data.url : data.url,
          type: documentType,
          publicId: data.data ? data.data.publicId : data.publicId
        }
      };
    } catch (error) {
      console.error('Document upload error:', error);
      let errorMessage = 'Failed to upload document';

      if (error.message === 'Network Error') {
        errorMessage = 'Cannot connect to server. Please check your internet connection and try again.';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Upload timed out after retries. Please check your connection and try again.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timed out. Please try again.';
      } else if (error.response) {
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      }

      console.log('Upload error details:', {
        errorMessage,
        errorType: error.name,
        errorCode: error.code,
        response: error.response?.data
      });

      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // Delete uploaded image from Cloudinary
  deleteImage: async (publicId) => {
    try {
      const response = await api.post('/uploads/delete', { publicId });
      return response.data;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  },
};

// Export the api instance
export default api;