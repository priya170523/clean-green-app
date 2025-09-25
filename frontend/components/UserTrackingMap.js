import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { getDirections, getFallbackDirections } from '../services/mapsService';

export default function UserTrackingMap({ navigation, route }) {
  const { pickupData } = route.params || {};
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [region, setRegion] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationUpdateError, setLocationUpdateError] = useState(null);

  const [routeWaypoints, setRouteWaypoints] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get current location
  useEffect(() => {
    let watchId;

    const getCurrentLocation = () => {
      if (!navigator?.geolocation) {
        setLocationUpdateError('Geolocation is not supported');
        return;
      }

      watchId = navigator.geolocation.watchPosition(
        position => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });
          setLocationUpdateError(null);
        },
        error => {
          console.error('Location error:', error);
          setLocationUpdateError('Unable to get current location');
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 10, // Update if moved by 10 meters
          timeout: 20000,
          maximumAge: 1000
        }
      );
    };

    getCurrentLocation();

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Fetch delivery location and user location from backend or props
  useEffect(() => {
    if (!pickupData) return;

    // Set user location from pickupData address or use current location
    const userLoc = pickupData.pickupLocation || pickupData.address || currentLocation || {
      latitude: 12.9756,
      longitude: 77.5996,
    };
    setUserLocation({
      latitude: userLoc.latitude,
      longitude: userLoc.longitude,
    });

    // Fetch delivery location from backend or props
    // For now, initialize to warehouse or pickupData.deliveryLocation if available
    // Use warehouse coordinates
    const deliveryLoc = pickupData.deliveryLocation || {
      latitude: 16.541373,
      longitude: 81.514552,
    };
    setDeliveryLocation({
      latitude: deliveryLoc.latitude,
      longitude: deliveryLoc.longitude,
    });

    // Set initial region centered between delivery and user
    setRegion({
      latitude: (deliveryLoc.latitude + userLoc.latitude) / 2,
      longitude: (deliveryLoc.longitude + userLoc.longitude) / 2,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  }, [pickupData]);

  // Calculate route when deliveryLocation and userLocation are set
  useEffect(() => {
    if (!deliveryLocation || !userLocation) return;

    const calculateRoute = async () => {
      setLoading(true);
      try {
        const result = await getDirections(deliveryLocation, userLocation);
        if (result.success) {
          setRouteWaypoints(result.waypoints);
          setRouteInfo({
            distance: result.distance,
            duration: result.duration,
          });
        } else {
          console.log('Using fallback route calculation');
          const fallbackResult = getFallbackDirections(deliveryLocation, userLocation);
          setRouteWaypoints(fallbackResult.waypoints);
          setRouteInfo({
            distance: fallbackResult.distance,
            duration: fallbackResult.duration,
          });
        }
      } catch (error) {
        console.error('Route calculation error:', error);
        const fallbackResult = getFallbackDirections(deliveryLocation, userLocation);
        setRouteWaypoints(fallbackResult.waypoints);
        setRouteInfo({
          distance: fallbackResult.distance,
          duration: fallbackResult.duration,
        });
      } finally {
        setLoading(false);
      }
    };

    calculateRoute();
  }, [deliveryLocation, userLocation]);

  // Update route when current location changes
  useEffect(() => {
    if (!currentLocation || !pickupData) return;

    const updateRoute = async () => {
      try {
        // Update the delivery location to current location
        setDeliveryLocation(currentLocation);
        
        // Recalculate route with new position
        const result = await getDirections(currentLocation, userLocation, {
          mode: 'driving',
          avoid: ['ferries', 'indoor'],
          units: 'metric',
          optimize: true
        });
        if (result.success) {
          setRouteWaypoints(result.waypoints);
          setRouteInfo({
            distance: result.distance,
            duration: result.duration,
          });
        }
      } catch (error) {
        console.error('Route update error:', error);
      }
    };

    updateRoute();
  }, [currentLocation, pickupData, userLocation]);

  // Calculate distance between delivery and user
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const distance = deliveryLocation && userLocation ? calculateDistance(
    deliveryLocation.latitude, 
    deliveryLocation.longitude,
    userLocation.latitude, 
    userLocation.longitude
  ) : 0;

  return (
    <View style={styles.container}>
      {pickupData?.status === 'completed' && (
        <View style={styles.thankYouContainer}>
          <Text style={styles.thankYouText}>
            Thank you for using our service! Your waste has been collected successfully.
          </Text>
        </View>
      )}
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Tracking</Text>
        <TouchableOpacity style={styles.mapsButton} onPress={() => Alert.alert('Open Maps', 'Opening in device maps app...')}>
          <Text style={styles.mapsButtonText}>Maps</Text>
        </TouchableOpacity>
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>🚚 Delivery Executive Coming</Text>
        <Text style={styles.statusText}>
          Our delivery executive is on the way to your location
        </Text>
        <Text style={styles.distanceText}>
          Distance: {distance.toFixed(2)} km • ETA: {Math.round(distance * 3)} min
        </Text>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {loading || !deliveryLocation || !userLocation ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Calculating route...</Text>
          </View>
        ) : (
          <MapView
            style={styles.map}
            region={region}
            onRegionChangeComplete={setRegion}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
            showsScale={true}
          >
            {/* User Location Marker */}
            <Marker
              coordinate={userLocation}
              title="Your Location"
              description="Pickup location"
              pinColor="green"
            />
            
            {/* Delivery Person Location Marker */}
            <Marker
              coordinate={deliveryLocation}
              title="Delivery Executive"
              description="Coming to you"
            >
              <View style={styles.bikeIcon}>
                <Text style={styles.bikeEmoji}>🏍️</Text>
              </View>
            </Marker>
            
            {/* Route Line */}
            {routeWaypoints.length > 0 && (
              <Polyline
                coordinates={routeWaypoints}
                strokeColor="#4CAF50"
                strokeWidth={4}
                lineDashPattern={[5, 5]}
              />
            )}
          </MapView>
        )}
      </View>

      {/* Executive Info */}
      <View style={styles.executiveCard}>
        <Text style={styles.executiveTitle}>Delivery Executive</Text>
        <Text style={styles.executiveName}>Rajesh Kumar</Text>
        <Text style={styles.executivePhone}>+91 98765 43210</Text>
        <Text style={styles.executiveVehicle}>E-rickshaw (Green)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  thankYouContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    padding: 15,
    borderRadius: 10,
    zIndex: 1000,
    elevation: 5,
  },
  thankYouText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: '#F1F8E9',
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
  mapsButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  mapsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#4CAF50',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  distanceText: {
    fontSize: 14,
    color: '#E8F5E9',
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingContainer: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  map: {
    flex: 1,
  },
  executiveCard: {
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
  executiveTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 8,
  },
  executiveName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 4,
  },
  executivePhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  executiveVehicle: {
    fontSize: 14,
    color: '#666',
  },
  bikeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  bikeEmoji: {
    fontSize: 20,
  },
});
