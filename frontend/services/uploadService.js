import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Base URL for the API
const BASE_URL = 'http://192.168.214.241:5000/api'; // WiFi IP for physical device

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
      
      // Get file extension and mime type
      const fileExtension = documentUri.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';
      
      // Create a unique filename
      const timestamp = new Date().getTime();
      const uniqueFilename = `${documentType}_${timestamp}`;
      
      formData.append('image', {
        uri: documentUri,
        type: mimeType,
        name: `${uniqueFilename}.${fileExtension}`,
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
          signal: controller.signal
        });

        clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
        console.error('Upload failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.message || `Upload failed with status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.data) {
        console.error('Invalid response format:', data);
        throw new Error('Upload failed: Invalid response from server');
      }

      // Validate required fields in response
      if (!data.data.url || !data.data.publicId) {
        console.error('Missing required fields in response:', data);
        throw new Error('Upload failed: Missing required data from server');
      }        return response;
      };

      const response = await retryUpload(uploadFn, 3, 2000);

      const data = await response.json();

      // Check for backend success at top level and inside data object
      if (!data.success || !data.data || !data.data.url || !data.data.publicId) {
        console.error('Upload response missing expected fields:', data);
        throw new Error('Upload failed: Invalid response from server');
      }

      console.log('Upload successful:', {
        status: response.status,
        size: response.headers.get('content-length'),
        type: response.headers.get('content-type'),
        data: data
      });

      // Update backend about the uploaded document
      const documentInfoPayload = {
        documentType,
        cloudinaryUrl: data.data.url,
        publicId: data.data.publicId
      };
      console.log('Sending document info request:', {
        url: `${BASE_URL}/uploads/document-info`,
        body: documentInfoPayload
      });

      const documentInfoResponse = await fetch(`${BASE_URL}/uploads/document-info`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(documentInfoPayload)
      });

      const documentInfoText = await documentInfoResponse.text();
      console.log('Document info response status:', documentInfoResponse.status);
      console.log('Document info response ok:', documentInfoResponse.ok);
      console.log('Document info raw response:', documentInfoText);

      // Handle document info response errors
      if (!documentInfoResponse.ok) {
        console.error('Document info error response:', documentInfoText);
        let errorData;
        try {
          errorData = JSON.parse(documentInfoText);
        } catch (e) {
          errorData = { error: { message: 'Invalid server response' } };
        }
        throw new Error(errorData.error?.message || `Failed to update document info: ${documentInfoResponse.status}`);
      }

      let documentData;
      try {
        documentData = JSON.parse(documentInfoText);
      } catch (e) {
        documentData = { success: false, error: { message: 'Invalid JSON in document info response' } };
      }
      console.log('Document info parsed data:', documentData);

      if (!documentData.success) {
        console.error('Document info update error:', documentData);
        throw new Error(documentData.error?.message || documentData.message || 'Failed to update document info');
      }

      return {
        success: true,
        data: {
          url: data.data.url,
          type: documentType,
          publicId: data.data.publicId
        }
      };
    } catch (error) {
      console.error('Document upload error:', {
        message: error.message,
        name: error.name,
        code: error.code,
        response: error.response?.data,
        stack: error.stack
      });

      let errorMessage = 'Failed to upload document';

      if (error.message === 'Network Error' || error.code === 'NETWORK_ERROR') {
        errorMessage = 'Cannot connect to server. Please check your internet connection and try again.';
      } else if (error.name === 'AbortError' || error.code === 'ETIMEDOUT') {
        errorMessage = 'Upload timed out after retries. Please check your connection and try again.';
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage = 'Upload timed out. Please try again.';
      } else if (error.response) {
        // Handle structured error responses
        const errorData = error.response.data;
        errorMessage = 
          errorData.error?.message || 
          errorData.message || 
          error.message || 
          `Server error: ${error.response.status}`;
      } else if (error.message.includes('Invalid response') || error.message.includes('Missing required')) {
        errorMessage = error.message;
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