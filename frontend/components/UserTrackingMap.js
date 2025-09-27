import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { getDirections, getFallbackDirections } from '../services/mapsService';
import { COLORS } from '../../theme/colors';

const LOCATION_SETTINGS = {
  accuracy: Location.Accuracy.Balanced,
  timeInterval: 5000,
  distanceInterval: 20
};

const MIN_UPDATE_INTERVAL = 10000; // 10 seconds between route updates

export default function UserTrackingMap({ navigation, route }) {
  const { pickupData } = route.params || {};
  
  // State management
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [region, setRegion] = useState(null);

  // Refs for cleanup and optimization
  const locationSubscription = useRef(null);
  const isSubscribed = useRef(true);
  const lastUpdate = useRef(0);

  const updateDeliveryRoute = useCallback(async (currentLoc) => {
    try {
      if (!currentLoc?.latitude || !currentLoc?.longitude) {
        console.log('Invalid current location');
        return;
      }

      if (!pickupData?.address?.location?.coordinates) {
        console.log('No pickup location available');
        return;
      }

      const destinationLoc = {
        latitude: pickupData.address.location.coordinates[1],
        longitude: pickupData.address.location.coordinates[0]
      };

      console.log('Updating route from', currentLoc, 'to', destinationLoc);
      const routeData = await getDirections(currentLoc, destinationLoc);
      
      if (!isSubscribed.current) return;

      if (routeData?.success && routeData?.waypoints) {
        console.log('Route updated with', routeData.waypoints.length, 'points');
        setRouteCoordinates(routeData.waypoints);
        setRouteInfo({
          distance: routeData.distance,
          duration: routeData.duration
        });
      } else {
        console.log('Using fallback route calculation');
        const fallbackResult = getFallbackDirections(currentLoc, destinationLoc);
        setRouteCoordinates(fallbackResult.waypoints);
        setRouteInfo({
          distance: fallbackResult.distance,
          duration: fallbackResult.duration
        });
      }
    } catch (error) {
      if (!isSubscribed.current) return;
      console.error('Error updating route:', error);
      Alert.alert('Route Error', 'Unable to calculate the route. Please try again.');
    }
  }, [pickupData]);

  const startLocationTracking = useCallback(async () => {
    try {
      setIsLoadingLocation(true);
      setLocationError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        Alert.alert(
          'Permission Required',
          'Please enable location services to see the pickup route.'
        );
        return;
      }

      // Get initial location
      const initialLocation = await Location.getCurrentPositionAsync({
        ...LOCATION_SETTINGS,
        maximumAge: 10000
      });

      if (!isSubscribed.current) return;

      const { latitude, longitude } = initialLocation.coords;
      const locationData = { latitude, longitude };
      
      console.log('Initial location:', locationData);
      setCurrentLocation(locationData);
      updateDeliveryRoute(locationData);
      lastUpdate.current = Date.now();

      // Set initial region
      const destinationCoords = pickupData?.address?.location?.coordinates;
      if (destinationCoords) {
        setRegion({
          latitude: (latitude + destinationCoords[1]) / 2,
          longitude: (longitude + destinationCoords[0]) / 2,
          latitudeDelta: Math.abs(latitude - destinationCoords[1]) * 2.5,
          longitudeDelta: Math.abs(longitude - destinationCoords[0]) * 2.5
        });
      }

      // Start watching location changes
      locationSubscription.current = await Location.watchPositionAsync(
        LOCATION_SETTINGS,
        (newLocation) => {
          if (!isSubscribed.current) return;

          const { latitude, longitude } = newLocation.coords;
          const locationData = { latitude, longitude };
          
          // Always update current location
          setCurrentLocation(locationData);

          // Debounce route updates
          const now = Date.now();
          if (now - lastUpdate.current >= MIN_UPDATE_INTERVAL) {
            console.log('Location update triggering route update:', locationData);
            lastUpdate.current = now;
            updateDeliveryRoute(locationData);
          }
        }
      );
    } catch (error) {
      if (!isSubscribed.current) return;
      console.error('Location error:', error);
      setLocationError('Unable to get location');
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please check your location settings.'
      );
    } finally {
      if (isSubscribed.current) {
        setIsLoadingLocation(false);
      }
    }
  }, [updateDeliveryRoute, pickupData]);

  // Initialize location tracking
  useEffect(() => {
    startLocationTracking();

    return () => {
      isSubscribed.current = false;
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, [startLocationTracking]);

  if (isLoadingLocation) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (locationError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{locationError}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={startLocationTracking}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentLocation || !pickupData?.address?.location) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Waiting for location data...</Text>
      </View>
    );
  }

  const destinationCoords = {
    latitude: pickupData.address.location.coordinates[1],
    longitude: pickupData.address.location.coordinates[0]
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Tracking</Text>
      </View>

      {/* Status Card */}
      {routeInfo && (
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>🚚 En Route</Text>
          <Text style={styles.statusText}>
            Distance: {routeInfo.distance} • ETA: {routeInfo.duration}
          </Text>
        </View>
      )}

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region || {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05
          }}
          onRegionChangeComplete={setRegion}
          showsUserLocation
          showsMyLocationButton
          showsCompass
          followsUserLocation
        >
          <Marker
            coordinate={currentLocation}
            title="Your Location"
            description="Current location"
            pinColor={COLORS.primary}
          />

          <Marker
            coordinate={destinationCoords}
            title="Pickup Location"
            description={pickupData?.address?.formatted_address || 'Pickup point'}
            pinColor={COLORS.secondary}
          />

          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={3}
              strokeColor={COLORS.primary}
              lineDashPattern={[1]}
            />
          )}
        </MapView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  backButton: {
    padding: 8
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginRight: 40
  },
  statusCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8
  },
  statusText: {
    fontSize: 14,
    color: '#666'
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden'
  },
  map: {
    flex: 1
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666'
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});