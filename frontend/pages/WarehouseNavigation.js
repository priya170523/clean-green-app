import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { getDirections, getFallbackDirections } from '../services/mapsService';

export default function WarehouseNavigation({ navigation, route }) {
  const { pickupData } = route.params || {};
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 12.9756, // Current pickup location
    longitude: 77.5996,
  });
  const [warehouseLocation] = useState({
    latitude: 12.9800, // Warehouse location
    longitude: 77.6100,
  });
  const [hasReached, setHasReached] = useState(false);
  const [showSubmittedButton, setShowSubmittedButton] = useState(false);
  const [showReachedButton, setShowReachedButton] = useState(true);
  const [routeWaypoints, setRouteWaypoints] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Calculate route to warehouse
  useEffect(() => {
    const calculateRoute = async () => {
      setLoading(true);
      try {
        const result = await getDirections(currentLocation, warehouseLocation);
        
        if (result.success) {
          setRouteWaypoints(result.waypoints);
          setRouteInfo({
            distance: result.distance,
            duration: result.duration,
          });
        } else {
          console.log('Using fallback route calculation for warehouse');
          const fallbackResult = getFallbackDirections(currentLocation, warehouseLocation);
          setRouteWaypoints(fallbackResult.waypoints);
          setRouteInfo({
            distance: fallbackResult.distance,
            duration: fallbackResult.duration,
          });
        }
      } catch (error) {
        console.error('Route calculation error:', error);
        console.log('Using fallback route calculation for warehouse');
        const fallbackResult = getFallbackDirections(currentLocation, warehouseLocation);
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
  }, [currentLocation, warehouseLocation]);

  // Simulate movement along the route
  useEffect(() => {
    if (routeWaypoints.length === 0) return;
    
    let currentWaypointIndex = 0;
    const interval = setInterval(() => {
      if (currentWaypointIndex < routeWaypoints.length - 1) {
        currentWaypointIndex++;
        const newLocation = routeWaypoints[currentWaypointIndex];
        setCurrentLocation(newLocation);
      } else {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [routeWaypoints]);

  const handleOpenMaps = () => {
    Alert.alert('Open Maps', 'Opening route to warehouse in device maps app...');
  };

  const handleReached = () => {
    // Simulate local status update without backend call
    setHasReached(true);
    setShowSubmittedButton(true);
    setShowReachedButton(false);
    Alert.alert('Status Updated', 'You have reached the warehouse!');
  };

  const handleSubmittedWaste = () => {
    // Simulate local status update without backend call
    Alert.alert('Waste Submitted', 'Waste successfully submitted to warehouse!');
    navigation.navigate('DeliveryMain');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // Calculate distance to warehouse
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const distance = calculateDistance(
    currentLocation.latitude, 
    currentLocation.longitude,
    warehouseLocation.latitude, 
    warehouseLocation.longitude
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Warehouse Navigation</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Success Message */}
      <View style={styles.successCard}>
        <Text style={styles.hurrayText}>Hurray!</Text>
        <Text style={styles.navigationText}>Navigating you to our warehouse</Text>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={{
            latitude: (currentLocation.latitude + warehouseLocation.latitude) / 2,
            longitude: (currentLocation.longitude + warehouseLocation.longitude) / 2,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          showsScale={true}
        >
          {/* Current Location Marker */}
          <Marker
            coordinate={currentLocation}
            title="Your Location"
            description="Current position"
            pinColor="blue"
          />
          
          {/* Warehouse Location Marker */}
          <Marker
            coordinate={warehouseLocation}
            title="Warehouse"
            description="Drop-off location"
            pinColor="green"
          />
          
          {/* Route Line */}
          <Polyline
            coordinates={[currentLocation, warehouseLocation]}
            strokeColor="#4CAF50"
            strokeWidth={4}
            lineDashPattern={[5, 5]}
          />
        </MapView>
      </View>

      {/* Distance Info */}
      <View style={styles.distanceCard}>
        <Text style={styles.distanceText}>
          Distance to warehouse: {distance.toFixed(2)} km
        </Text>
        <Text style={styles.etaText}>
          Estimated time: {Math.round(distance * 2)} minutes
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleOpenMaps}>
          <Text style={styles.actionButtonText}>open in Maps</Text>
        </TouchableOpacity>
        
        {showReachedButton && (
          <TouchableOpacity 
            style={[styles.actionButton, hasReached && styles.reachedButton]} 
            onPress={handleReached}
          >
            <Text style={[styles.actionButtonText, hasReached && styles.reachedButtonText]}>
              reached
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Submit Waste Button - Only shown after reaching */}
      {showSubmittedButton && (
        <View style={styles.submitContainer}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmittedWaste}>
            <Text style={styles.submitButtonText}>Submitted waste.</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Pickup Info */}
      {pickupData && (
        <View style={styles.pickupInfo}>
          <Text style={styles.pickupTitle}>Pickup Details</Text>
          <Text style={styles.pickupText}>Type: {pickupData.type}</Text>
          <Text style={styles.pickupText}>Weight: {pickupData.weight}</Text>
          <Text style={styles.pickupText}>Customer: {pickupData.customerName}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  placeholder: {
    width: 60,
  },
  successCard: {
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
  hurrayText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  navigationText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  mapContainer: {
    height: 300,
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  map: {
    flex: 1,
  },
  distanceCard: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  distanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 4,
  },
  etaText: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#C8E6C9',
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  reachedButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#2E7D32',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B5E20',
  },
  reachedButtonText: {
    color: '#fff',
  },
  submitContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  pickupInfo: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pickupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 8,
  },
  pickupText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});
