import React, { useState, useEffect } from 'react';

const formatAddress = (address) => {
  if (!address) return '';
  if (typeof address === 'string') return address;

  const parts = [];
  if (address.houseFlatBlock) parts.push(address.houseFlatBlock);
  if (address.apartmentRoadArea) parts.push(address.apartmentRoadArea);
  if (address.landmark) parts.push(address.landmark);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.pincode) parts.push(address.pincode);

  return parts.join(', ');
};

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Platform
} from 'react-native';

import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import base64 from 'base-64';
import { getDirections, getFallbackDirections } from '../services/mapsService';
import { dummyNotifications } from '../services/dummyData';
import { pickupAPI } from '../services/apiService';
import { api } from '../services/api';
import * as ImagePicker from 'expo-image-picker';

export default function DeliveryRoutePage({ navigation, route }) {
  const { pickupData } = route.params || {};
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 12.9756, // Default location (Bangalore)
    longitude: 77.5996,
  });
  const [pickupLocation, setPickupLocation] = useState(null);
  const [routeWaypoints, setRouteWaypoints] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pickupStatus, setPickupStatus] = useState('accepted'); // accepted, reached, picked
  const [showPickedButton, setShowPickedButton] = useState(false);
  const [showReachedButton, setShowReachedButton] = useState(true);
  const [locationLoaded, setLocationLoaded] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);

  // Get current location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          setLocationLoaded(true);
        } else {
          console.warn('Location permission denied');
        }
      } catch (error) {
        console.error('Error getting current location:', error);
      }
    })();
  }, []);

  // Initialize pickup location from pickup data
  useEffect(() => {
    if (pickupData) {
      const userAddress = pickupData.user?.address;
      if (userAddress && userAddress.latitude && userAddress.longitude) {
        setPickupLocation({
          latitude: userAddress.latitude,
          longitude: userAddress.longitude,
        });
      } else {
        // Fallback: use default location if user address coordinates not available
        setPickupLocation({
          latitude: 12.9756,
          longitude: 77.5996,
        });
      }
    }
  }, [pickupData]);

  // Calculate route when locations are available
  useEffect(() => {
    if (currentLocation && pickupLocation) {
      calculateRoute();
    }
  }, [currentLocation, pickupLocation]);

  const calculateRoute = async () => {
    if (!pickupLocation) return;

    setLoading(true);
    try {
      const result = await getDirections(currentLocation, pickupLocation);

      if (result.success) {
        setRouteWaypoints(result.waypoints);
        setRouteInfo({
          distance: result.distance,
          duration: result.duration,
        });
      } else {
        console.log('Using fallback route calculation');
        const fallbackResult = getFallbackDirections(currentLocation, pickupLocation);
        setRouteWaypoints(fallbackResult.waypoints);
        setRouteInfo({
          distance: fallbackResult.distance,
          duration: fallbackResult.duration,
        });
      }
    } catch (error) {
      console.error('Route calculation error:', error);
      const fallbackResult = getFallbackDirections(currentLocation, pickupLocation);
      setRouteWaypoints(fallbackResult.waypoints);
      setRouteInfo({
        distance: fallbackResult.distance,
        duration: fallbackResult.duration,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInMaps = () => {
    if (!pickupLocation) return;

    const url = Platform.select({
      ios: `maps://app?daddr=${pickupLocation.latitude},${pickupLocation.longitude}&dirflg=d`,
      android: `google.navigation:q=${pickupLocation.latitude},${pickupLocation.longitude}`,
    });

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open maps application');
      }
    });
  };

  const handleReached = async () => {
    try {
      await pickupAPI.updatePickupStatus(pickupData._id, 'in_progress', null, 'Reached pickup location');
      setPickupStatus('reached');
      setShowPickedButton(true);
      setShowReachedButton(false);
      Alert.alert('Status Updated', 'You have reached the pickup location!');
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handlePicked = async () => {
    try {
      const distance = routeInfo?.distance ?
        (typeof routeInfo.distance === 'string' ?
          parseFloat(routeInfo.distance.replace(' km', '')) :
          routeInfo.distance
        ) : 0;

      // Update pickup status
      await pickupAPI.updatePickupStatus(pickupData._id, 'completed', null, 'Pickup completed', distance);
      setPickupStatus('picked');

      // Update user progress for spin eligibility
      try {
        await api.post('/api/progress/update', {
          pickupId: pickupData._id,
          weight: pickupData.wasteDetails?.quantity || 0
        });
      } catch (progressError) {
        console.error('Error updating progress:', progressError);
      }

      // Show thank you message
      setShowThankYou(true);

      // Wait for 2 seconds to show the thank you message
      setTimeout(() => {
        // Navigate to WarehouseNavigation with pickup location
        navigation.navigate('WarehouseNavigation', {
          pickupData: {
            ...pickupData,
            pickupLocation: pickupLocation || currentLocation
          }
        });
      }, 2000);
    } catch (error) {
      console.error('Error updating pickup status:', error);
      Alert.alert('Error', 'Failed to update pickup status');
    }
  };

  const handleSupport = () => {
    navigation.navigate('Support');
  };

  const handleUploadPhoto = async () => {
    try {
      setIsUploading(true);

      // Request camera permissions
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Camera access is required to take photos');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      console.log('Camera result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;

        // Get file info
        const localUri = imageUri;
        const filename = localUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        console.log('Photo details:', { localUri, filename, type });

        // Create form data with file upload format (same as user upload)
        const formData = new FormData();
        formData.append('photo', {
          uri: imageUri,
          type: type,
          name: filename,
        });

        console.log('FormData created with file upload');
        console.log('Pickup ID:', pickupData._id);

        // Upload photo using pickupAPI
        const response = await pickupAPI.uploadPickupPhoto(pickupData._id, formData);
        console.log('Photo upload response:', response);

        if (response.status === 'success') {
          setUploadedImages([...uploadedImages, response.data.url]);
          Alert.alert('Success', 'Photo uploaded successfully');
        } else {
          throw new Error(response.message || 'Failed to upload photo');
        }
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo: ' + (error.message || 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleCallCustomer = () => {
    const phoneNumber = pickupData?.user?.phone || pickupData?.customerPhone;
    if (phoneNumber) {
      const url = `tel:${phoneNumber}`;
      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Unable to make phone call');
        }
      });
    } else {
      Alert.alert('Error', 'Customer phone number not available');
    }
  };

  const handleMessageCustomer = () => {
    const phoneNumber = pickupData?.user?.phone || pickupData?.customerPhone;
    if (phoneNumber) {
      const url = `sms:${phoneNumber}`;
      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Unable to send message');
        }
      });
    } else {
      Alert.alert('Error', 'Customer phone number not available');
    }
  };

  if (!pickupData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Pickup data not available</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pickup Route</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Map Section */}
      <View style={styles.mapSection}>
        <View style={styles.mapContainer}>
          <Text style={styles.mapTitle}>Route to Pickup Location</Text>

          {loading || !locationLoaded ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Calculating route...</Text>
            </View>
          ) : (
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              region={{
                latitude: (currentLocation.latitude + (pickupLocation?.latitude || 0)) / 2,
                longitude: (currentLocation.longitude + (pickupLocation?.longitude || 0)) / 2,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
              showsUserLocation={true}
              showsMyLocationButton={true}
              showsCompass={true}
            >
              {/* Current Location Marker */}
              <Marker
                coordinate={currentLocation}
                title="Your Location"
                description="Current position"
                pinColor="blue"
              />

              {/* Pickup Location Marker */}
              {pickupLocation && (
                <Marker
                  coordinate={pickupLocation}
                  title="Pickup Location"
                  description={pickupData.user?.address?.formattedAddress || "Customer address"}
                  pinColor="green"
                />
              )}

              {/* Route Line */}
              {routeWaypoints.length > 0 && (
                <Polyline
                  coordinates={routeWaypoints}
                  strokeColor="#4CAF50"
                  strokeWidth={4}
                />
              )}
            </MapView>
          )}

          <TouchableOpacity style={styles.openMapsButton} onPress={handleOpenInMaps}>
            <Text style={styles.openMapsButtonText}>Open in Maps</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Route Info */}
      {routeInfo && (
        <View style={styles.routeInfoCard}>
          <Text style={styles.routeInfoTitle}>Route Information</Text>
          <View style={styles.routeInfoRow}>
            <Text style={styles.routeInfoLabel}>Distance:</Text>
            <Text style={styles.routeInfoValue}>
              {routeInfo.distance ?
                (typeof routeInfo.distance === 'string' ?
                  parseFloat(routeInfo.distance.replace(' km', '')).toFixed(2) :
                  routeInfo.distance.toFixed(2)
                ) : '0.00'
              } km
            </Text>
          </View>
          <View style={styles.routeInfoRow}>
            <Text style={styles.routeInfoLabel}>Estimated Time:</Text>
            <Text style={styles.routeInfoValue}>{routeInfo.duration ? Math.round(routeInfo.duration) : 0} minutes</Text>
          </View>
          <View style={styles.routeInfoRow}>
            <Text style={styles.routeInfoLabel}>Potential Earnings:</Text>
            <Text style={styles.routeInfoValue}>₹{pickupData.earnings || '50-150'}</Text>
          </View>
        </View>
      )}

      {/* Customer Details */}
      <View style={styles.customerCard}>
        <Text style={styles.sectionTitle}>Customer Details</Text>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>
            {pickupData.user?.name || pickupData.customerName || 'Customer'}
          </Text>
          <Text style={styles.customerPhone}>
            {pickupData.user?.phone || pickupData.customerPhone || 'Phone not available'}
          </Text>
          <Text style={styles.customerAddress}>
            {pickupData.user?.address?.formattedAddress || formatAddress(pickupData.user?.address) || 'Address not available'}
          </Text>
        </View>

        <View style={styles.customerActions}>
          <TouchableOpacity style={styles.actionButtonSmall} onPress={handleCallCustomer}>
            <Text style={styles.actionButtonIcon}>📞</Text>
            <Text style={styles.actionButtonTextSmall}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButtonSmall} onPress={handleMessageCustomer}>
            <Text style={styles.actionButtonIcon}>💬</Text>
            <Text style={styles.actionButtonTextSmall}>Message</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Pickup Details */}
      <View style={styles.pickupCard}>
        <Text style={styles.sectionTitle}>Pickup Details</Text>
        <View style={styles.pickupInfo}>
          <Text style={styles.pickupType}>
            Waste Type: {pickupData.wasteType || 'Mixed'}
          </Text>
          <Text style={styles.pickupWeight}>
            Estimated Weight: {pickupData.estimatedWeight ? pickupData.estimatedWeight * 1000 : 0} grams
          </Text>

          {pickupData.wasteDetails && (
            <View style={styles.wasteDetails}>
              {pickupData.wasteDetails.foodBoxes > 0 && (
                <Text style={styles.detailText}>
                  • Food Boxes: {pickupData.wasteDetails.foodBoxes}
                </Text>
              )}
              {pickupData.wasteDetails.bottles > 0 && (
                <Text style={styles.detailText}>
                  • Bottles: {pickupData.wasteDetails.bottles}
                </Text>
              )}
              {pickupData.wasteDetails.otherItems && (
                <Text style={styles.detailText}>
                  • Other: {pickupData.wasteDetails.otherItems}
                </Text>
              )}
            </View>
          )}

          {pickupData.images && pickupData.images.length > 0 && (
            <View style={styles.imagesSection}>
              <Text style={styles.imagesLabel}>Reference Images:</Text>
              <Text style={styles.imagesCount}>{pickupData.images.length} image(s) uploaded</Text>
            </View>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsCard}>
        <View style={styles.actionButtons}>
          {showReachedButton && (
            <TouchableOpacity
              style={[styles.actionButton, pickupStatus === 'reached' && styles.actionButtonActive]}
              onPress={handleReached}
            >
              <Text style={styles.actionButtonText}>Mark as Reached</Text>
            </TouchableOpacity>
          )}

          {/* Require photo upload after reached */}
          {pickupStatus === 'reached' && (
            <TouchableOpacity
              style={[styles.actionButton, isUploading && styles.actionButtonDisabled]}
              onPress={handleUploadPhoto}
              disabled={isUploading}
            >
              <Text style={styles.actionButtonText}>{isUploading ? 'Uploading...' : 'Upload Photo'}</Text>
            </TouchableOpacity>
          )}
          {pickupStatus === 'reached' && uploadedImages && uploadedImages.length > 0 && (
            <TouchableOpacity
              style={[styles.actionButton, pickupStatus === 'picked' && styles.actionButtonActive]}
              onPress={handlePicked}
            >
              <Text style={styles.actionButtonText}>Pickup Complete</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.supportButton} onPress={handleSupport}>
            <Text style={styles.supportButtonText}>Need Support?</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Thank you overlay */}
      {showThankYou && (
        <View style={{ position: 'absolute', top: 100, left: 0, right: 0, alignItems: 'center', zIndex: 100 }}>
          <View style={{ backgroundColor: '#4CAF50', padding: 20, borderRadius: 10 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Thank you!</Text>
            <Text style={{ color: '#fff', fontSize: 14, marginTop: 8 }}>Waste is successfully picked. Thank you for your contribution to the environment.</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B5E20',
  },
  placeholder: {
    width: 60,
  },
  mapSection: {
    padding: 20,
  },
  mapContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B5E20',
    padding: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  map: {
    height: 250,
  },
  openMapsButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    margin: 16,
    borderRadius: 8,
  },
  openMapsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  routeInfoCard: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  routeInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 12,
  },
  routeInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  routeInfoLabel: {
    fontSize: 14,
    color: '#666',
  },
  routeInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B5E20',
  },
  customerCard: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pickupCard: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 12,
  },
  customerInfo: {
    marginBottom: 16,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  customerAddress: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  customerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButtonSmall: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  actionButtonTextSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1B5E20',
  },
  pickupInfo: {
    marginBottom: 12,
  },
  pickupType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 4,
  },
  pickupWeight: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  wasteDetails: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  imagesSection: {
    alignItems: 'center',
  },
  imagesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 4,
  },
  imagesCount: {
    fontSize: 12,
    color: '#666',
  },
  actionsCard: {
    padding: 20,
    paddingTop: 0,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  actionButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#2E7D32',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B5E20',
  },
  supportButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8F5E9',
  },
  supportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B5E20',
  },
});
