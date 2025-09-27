import { api } from './api';

export const pickupAPI = {
  // Get pickup details
  getPickupDetails: async (pickupId) => {
    try {
      const response = await api.get(`/pickups/${pickupId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting pickup details:', error);
      throw error;
    }
  },

  // Update pickup status
  updateStatus: async (pickupId, status, location = null) => {
    try {
      const payload = { status };
      if (location) {
        payload.location = location;
      }
      
      const response = await api.put(`/pickups/${pickupId}/status`, payload);
      return response.data;
    } catch (error) {
      console.error('Error updating pickup status:', error);
      throw error;
    }
  },

  // Update pickup progress
  updateProgress: async (pickupId, progressData) => {
    try {
      const response = await api.post(`/pickups/${pickupId}/progress`, progressData);
      return response.data;
    } catch (error) {
      console.error('Error updating pickup progress:', error);
      throw error;
    }
  },

  // Complete pickup
  completePickup: async (pickupId, completionData) => {
    try {
      const response = await api.put(`/pickups/${pickupId}/complete`, completionData);
      return response.data;
    } catch (error) {
      console.error('Error completing pickup:', error);
      throw error;
    }
  },

  // Cancel pickup
  cancelPickup: async (pickupId, reason) => {
    try {
      const response = await api.put(`/pickups/${pickupId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error canceling pickup:', error);
      throw error;
    }
  },

  // Add pickup notes
  addNotes: async (pickupId, notes) => {
    try {
      const response = await api.post(`/pickups/${pickupId}/notes`, { notes });
      return response.data;
    } catch (error) {
      console.error('Error adding pickup notes:', error);
      throw error;
    }
  },

  // Upload pickup photos
  uploadPhotos: async (pickupId, photos) => {
    try {
      const formData = new FormData();
      photos.forEach((photo, index) => {
        formData.append('photos', {
          uri: photo.uri,
          type: 'image/jpeg',
          name: `photo_${index}.jpg`
        });
      });

      const response = await api.post(`/pickups/${pickupId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading pickup photos:', error);
      throw error;
    }
  }
};

export default pickupAPI;
