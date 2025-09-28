import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { pickupAPI } from '../services/apiService';
import RealMap from '../components/RealMap';

export default function DeliveryPickupAccepted({ navigation, route }) {
  const { pickupData } = route.params || {};
  
  const [pickupStatus, setPickupStatus] = useState('accepted'); // accepted, reached, picked
  const [showPickedButton, setShowPickedButton] = useState(false);
  const [showReachedButton, setShowReachedButton] = useState(true);
  
  const pickupDetails = pickupData || {
    id: 1,
    type: 'Plastic Waste',
    weight: '2.5kg',
    items: ['Plastic bottles', 'Food containers', 'Packaging materials'],
    earnings: 150,
    customerName: 'John Doe',
    customerPhone: '+91 98765 43210',
    address: '123 Main Street, City, State 12345'
  };

  const handleOpenMaps = () => {
    // Navigate to full map view
    navigation.navigate('MapView', {
      pickupData: pickupData,
      showFullMap: true,
    });
  };

  const handleReached = async () => {
    try {
      await pickupAPI.updatePickupStatus(pickupData?._id, 'in_progress', null, 'Agent reached pickup', null);
      setPickupStatus('reached');
      setShowPickedButton(true);
      setShowReachedButton(false);
      Alert.alert('Status Updated', 'You have marked as reached the pickup location!');
    } catch (e) {
      console.error('Error updating status:', e);
      Alert.alert('Error', 'Failed to update status: ' + (e.message || 'Unknown error'));
    }
  };

  const handlePicked = async () => {
    try {
      // Keep status in_progress while moving to warehouse
      await pickupAPI.updatePickupStatus(pickupData?._id, 'in_progress', null, 'Waste picked, en route to warehouse', null);
      setPickupStatus('picked');
      Alert.alert('Pickup Updated', 'Proceed to warehouse for submission.');
      navigation.navigate('WarehouseNavigation', {
        pickupData: { ...pickupDetails, _id: pickupData?._id }
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleSupport = () => {
    navigation.navigate('Support');
  };

  const handleCallCustomer = () => {
    Alert.alert('Call Customer', `Calling ${pickupDetails.customerName} at ${pickupDetails.customerPhone}`);
  };

  const handleMessageCustomer = () => {
    Alert.alert('Message Customer', `Messaging ${pickupDetails.customerName}`);
  };

  const handleViewCustomerProfile = () => {
    Alert.alert('Customer Profile', `Viewing profile of ${pickupDetails.customerName}`);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Route map</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Map Section */}
      <View style={styles.mapSection}>
        <View style={styles.mapContainer}>
          <Text style={styles.mapTitle}>Route map</Text>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapIcon}>🗺️</Text>
            <Text style={styles.mapText}>Route map</Text>
          </View>
          <TouchableOpacity style={styles.openMapsButton} onPress={handleOpenMaps}>
            <Text style={styles.openMapsButtonText}>open with maps</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Pickup Details Section */}
      <View style={styles.pickupDetailsSection}>
        <Text style={styles.sectionTitle}>Pickup details:</Text>
        <View style={styles.detailsContainer}>
          <View style={styles.detailsRow}>
            <View style={styles.detailColumn}>
              <Text style={styles.detailLabel}>items list</Text>
              <View style={styles.itemsList}>
                {pickupDetails.items.map((item, index) => (
                  <Text key={index} style={styles.itemText}>• {item}</Text>
                ))}
              </View>
            </View>
            <View style={styles.detailColumn}>
              <Text style={styles.detailLabel}>weight</Text>
              <View style={styles.weightBox}>
                <Text style={styles.weightText}>{pickupDetails.weight}</Text>
              </View>
            </View>
          </View>
          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>earning for this Pickup: Z</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons and Customer Info */}
      <View style={styles.bottomSection}>
        <View style={styles.actionButtons}>
          {showReachedButton && (
            <TouchableOpacity 
              style={[styles.actionButton, pickupStatus === 'reached' && styles.actionButtonActive]} 
              onPress={handleReached}
            >
              <Text style={styles.actionButtonText}>reached</Text>
            </TouchableOpacity>
          )}
          {showPickedButton && (
            <TouchableOpacity 
              style={[styles.actionButton, pickupStatus === 'picked' && styles.actionButtonActive]} 
              onPress={handlePicked}
            >
              <Text style={styles.actionButtonText}>Picked</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionButton} onPress={handleSupport}>
            <Text style={styles.actionButtonText}>Support</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>customer name</Text>
          <View style={styles.customerActions}>
            <TouchableOpacity style={styles.customerActionButton} onPress={handleViewCustomerProfile}>
              <Text style={styles.customerActionIcon}>👤</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.customerActionButton} onPress={handleCallCustomer}>
              <Text style={styles.customerActionIcon}>📞</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.customerActionButton} onPress={handleMessageCustomer}>
              <Text style={styles.customerActionIcon}>✉️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F8E9', // Very light green background
  },
  header: {
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1B5E20',
    textAlign: 'center',
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
  mapSection: {
    flex: 1,
    padding: 20,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
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
    marginBottom: 12,
    textAlign: 'center',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  mapIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  mapText: {
    fontSize: 16,
    color: '#666',
  },
  openMapsButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  openMapsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mapContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mapIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  mapText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 4,
  },
  mapSubtext: {
    fontSize: 14,
    color: '#666',
  },
  openMapsButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  openMapsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pickupDetailsSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 16,
  },
  detailsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  detailColumn: {
    flex: 1,
    marginHorizontal: 8,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 8,
  },
  itemsList: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
  },
  itemText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  weightBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  weightText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B5E20',
  },
  earningsRow: {
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  bottomSection: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
  },
  actionButtons: {
    flex: 1,
    marginRight: 16,
  },
  actionButton: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  actionButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#2E7D32',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B5E20',
  },
  customerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 12,
    textAlign: 'center',
  },
  customerActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  customerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  customerActionIcon: {
    fontSize: 18,
    color: '#fff',
  },
});

