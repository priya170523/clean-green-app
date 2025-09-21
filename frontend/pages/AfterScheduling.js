import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';

export default function AfterScheduling({ navigation, route }) {
  const {
    wasteType,
    foodBoxes,
    bottles,
    otherItems,
    images,
    immediatePickup,
    address,
    estimatedWeight
  } = route.params || {};

  const [couponCode, setCouponCode] = useState('');
  const [earnedRewards] = useState(150); // Mock reward amount
  const [isAssigning, setIsAssigning] = useState(true);
  const [isAssigned, setIsAssigned] = useState(false);
  const [executiveDetails, setExecutiveDetails] = useState(null);

  useEffect(() => {
    // Generate coupon code
    const code = `CLEAN${earnedRewards}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setCouponCode(code);

    // Simulate pickup executive assignment
    simulateAssignment();
  }, []);

  const simulateAssignment = async () => {
    // Show assignment animation for 3-5 seconds
    const assignmentTime = Math.random() * 2000 + 3000; // 3-5 seconds

    setTimeout(() => {
      setIsAssigning(false);
      setIsAssigned(true);

      // Mock executive details
      setExecutiveDetails({
        name: 'Rajesh Kumar',
        phone: '+91 98765 43210',
        vehicle: 'E-rickshaw (Green)',
        eta: immediatePickup ? '15-20 minutes' : 'Tomorrow 10:00 AM',
        rating: 4.8,
        totalPickups: 1247
      });
    }, assignmentTime);
  };

  const handleSchedule = () => {
    navigation.navigate('WasteUploadNew');
  };

  const handleViewMap = () => {
    navigation.navigate('UserTrackingMap', {
      pickupData: {
        type: wasteType,
        immediatePickup,
        address: address
      }
    });
  };

  const handleHome = () => {
    navigation.navigate('Dashboard');
  };

  const handleCallExecutive = () => {
    if (executiveDetails) {
      Alert.alert('Call Executive', `Calling ${executiveDetails.name} at ${executiveDetails.phone}`);
    }
  };

  const handleMessageExecutive = () => {
    if (executiveDetails) {
      Alert.alert('Message Executive', `Opening chat with ${executiveDetails.name}`);
    }
  };

  const renderAssignmentAnimation = () => (
    <View style={styles.assignmentContainer}>
      <View style={styles.animationCircle}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
      <Text style={styles.assignmentTitle}>Finding your pickup executive</Text>
      <Text style={styles.assignmentSubtitle}>
        We're connecting you with the nearest available delivery partner...
      </Text>
      <View style={styles.progressDots}>
        <View style={[styles.dot, styles.activeDot]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
    </View>
  );

  const renderExecutiveDetails = () => (
    <View style={styles.section}>
      <View style={styles.executiveContainer}>
        <Text style={styles.sectionTitle}>Pickup executive details</Text>
        <View style={styles.executiveIcons}>
          <TouchableOpacity style={styles.callButton} onPress={handleCallExecutive}>
            <Text style={styles.callButtonText}>📞</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.messageButton} onPress={handleMessageExecutive}>
            <Text style={styles.messageButtonText}>💬</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.executiveInfo}>
        <Text style={styles.executiveName}>{executiveDetails.name}</Text>
        <Text style={styles.executivePhone}>{executiveDetails.phone}</Text>
        <Text style={styles.executiveVehicle}>{executiveDetails.vehicle}</Text>
        <Text style={styles.estimatedTime}>
          {immediatePickup ? `ETA: ${executiveDetails.eta}` : `Scheduled: ${executiveDetails.eta}`}
        </Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingText}>⭐ {executiveDetails.rating}</Text>
          <Text style={styles.pickupCount}>({executiveDetails.totalPickups} pickups completed)</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pickup Confirmation</Text>
      </View>

      <View style={styles.content}>
        {/* Congratulations Section */}
        <View style={styles.congratsContainer}>
          <Text style={styles.congratsText}>🎉 Pickup Requested!</Text>
          <Text style={styles.rewardsText}>
            Your {wasteType} waste pickup has been scheduled
          </Text>
        </View>

        {/* Assignment Status */}
        {isAssigning && renderAssignmentAnimation()}

        {/* Coupon Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>reward earned</Text>
          <View style={styles.couponContainer}>
            <Text style={styles.couponCode}>{couponCode}</Text>
            <Text style={styles.couponDescription}>
              Use this code on your next pickup for ₹{earnedRewards} off
            </Text>
          </View>
        </View>

        {/* Map Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>pickup location</Text>
          <View style={styles.mapContainer}>
            <Text style={styles.mapPlaceholder}>📍 {address?.label || 'Your Address'}</Text>
            <Text style={styles.mapDescription}>
              {address?.fullAddress || 'Address details will be shown here'}
            </Text>
            <TouchableOpacity style={styles.viewMapButton} onPress={handleViewMap}>
              <Text style={styles.viewMapButtonText}>View on Map</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Executive Details */}
        {isAssigned && executiveDetails && renderExecutiveDetails()}

        {/* Waste Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>pickup summary</Text>
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>Waste Type: {wasteType}</Text>
            {foodBoxes > 0 && <Text style={styles.summaryText}>Food Containers: {foodBoxes}</Text>}
            {bottles > 0 && <Text style={styles.summaryText}>Bottles: {bottles}</Text>}
            {otherItems && <Text style={styles.summaryText}>Other Items: {otherItems}</Text>}
            <Text style={styles.summaryText}>Estimated Weight: {estimatedWeight}kg</Text>
            <Text style={styles.summaryText}>
              Priority: {immediatePickup ? 'Immediate Pickup' : 'Scheduled Pickup'}
            </Text>
          </View>
        </View>

        {/* Thank You Message */}
        <View style={styles.thankYouContainer}>
          <Text style={styles.thankYouText}>
            Thank you for being a part of Green India! 🌱
          </Text>
          <Text style={styles.thankYouSubText}>
            Your contribution helps make our planet cleaner and greener.
          </Text>
        </View>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navButton} onPress={handleHome}>
          <Text style={styles.navButtonText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={handleSchedule}>
          <Text style={styles.navButtonText}>New Pickup</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={handleViewMap}>
          <Text style={styles.navButtonText}>Track</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F8E9',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
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
  content: {
    flex: 1,
    padding: 20,
  },
  congratsContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
  },
  congratsText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4CAF50',
    marginBottom: 8,
  },
  rewardsText: {
    fontSize: 16,
    color: '#1B5E20',
    textAlign: 'center',
  },
  assignmentContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  animationCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  assignmentTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 8,
    textAlign: 'center',
  },
  assignmentSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
  },
  activeDot: {
    backgroundColor: '#4CAF50',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 12,
  },
  couponContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  couponCode: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4CAF50',
    marginBottom: 8,
    letterSpacing: 2,
  },
  couponDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  mapContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mapPlaceholder: {
    fontSize: 24,
    marginBottom: 8,
  },
  mapDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  viewMapButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  viewMapButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  executiveContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  executiveIcons: {
    flexDirection: 'row',
    gap: 10,
  },
  callButton: {
    backgroundColor: '#4CAF50',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButtonText: {
    fontSize: 20,
  },
  messageButton: {
    backgroundColor: '#2196F3',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  executiveInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  executiveName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B5E20',
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
    marginBottom: 4,
  },
  estimatedTime: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#FF9800',
    marginRight: 8,
  },
  pickupCount: {
    fontSize: 12,
    color: '#666',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  thankYouContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  thankYouText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B5E20',
    textAlign: 'center',
    marginBottom: 8,
  },
  thankYouSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B5E20',
  },
});
