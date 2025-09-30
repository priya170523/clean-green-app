import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { pickupAPI } from '../services/apiService';
import { authService } from '../services/authService';

export default function SchedulePickupPage({ navigation, route }) {
  const { wasteType, foodBoxes, bottles, otherItems, images, address } = route.params || {};
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const auth = await authService.isAuthenticated();
        if (!auth) {
          Alert.alert(
            'Authentication Required',
            'Please log in to continue',
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('Auth')
              }
            ]
          );
          return;
        }
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check error:', error);
        Alert.alert(
          'Error',
          'Authentication failed. Please try logging in again.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Auth')
            }
          ]
        );
      }
    };

    checkAuth();
  }, [navigation]);

  const timeSlots = [
    '10:00 to 11:00',
    '9:00pm to 11:00pm',
    '2:00pm to 4:00pm',
    '6:00pm to 8:00pm',
  ];

  const handleSchedule = async () => {
    if (!isAuthenticated) {
      Alert.alert('Error', 'Please log in to schedule pickup');
      return;
    }
    if (!selectedTimeSlot) {
      Alert.alert('Error', 'Please select a time slot');
      return;
    }
    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date');
      return;
    }
    if (!address) {
      Alert.alert('Error', 'Address is required to schedule pickup');
      return;
    }

    setLoading(true);

    try {
      const wasteDetails = {};
      if (wasteType === 'food') {
        wasteDetails.foodBoxes = foodBoxes;
      } else if (wasteType === 'bottles') {
        wasteDetails.bottles = bottles;
      } else if (wasteType === 'other') {
        wasteDetails.otherItems = otherItems;
      }

      const scheduledDateISO = new Date(selectedDate).toISOString();

      const pickupData = {
        address: address._id,
        wasteType,
        wasteDetails,
        images,
        priority: 'scheduled',
        scheduledDate: scheduledDateISO,
        scheduledTime: selectedTimeSlot,
      };

      const response = await pickupAPI.createPickup(pickupData);

      setLoading(false);

      Alert.alert(
        'Schedule Confirmed',
        `Your pickup is scheduled for ${selectedTimeSlot}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('AfterScheduling', {
              wasteType,
              foodBoxes,
              bottles,
              otherItems,
              images,
              scheduledTime: selectedTimeSlot,
              pickupId: response.data.pickup._id,
            }),
          },
        ]
      );
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', error.response?.data?.message || 'Failed to schedule pickup');
    }
  };

  const handleHome = () => {
    navigation.navigate('Dashboard');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Schedule Pickup</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00C897" />
          <Text style={styles.loadingText}>Checking authentication...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule Pickup</Text>
      </View>

      <View style={styles.content}>
        {/* Choose Day Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>choose day</Text>
          <TouchableOpacity style={styles.inputContainer} onPress={() => {
            // TODO: Implement date picker modal
            Alert.alert('Info', 'Date picker not implemented yet');
          }}>
            <Text style={styles.calendarIcon}>📅</Text>
            <Text style={styles.datePlaceholder}>{selectedDate || 'DD/MM/YY'}</Text>
          </TouchableOpacity>
        </View>

        {/* Choose Time Slot Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>choose time Slot</Text>
          <View style={styles.timeSlotsContainer}>
            {timeSlots.map((slot, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.timeSlot,
                  selectedTimeSlot === slot && styles.selectedTimeSlot
                ]}
                onPress={() => setSelectedTimeSlot(slot)}
              >
                <Text style={[
                  styles.timeSlotText,
                  selectedTimeSlot === slot && styles.selectedTimeSlotText
                ]}>
                  {slot}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Schedule Button */}
        <TouchableOpacity style={styles.scheduleButton} onPress={handleSchedule} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.scheduleButtonText}>Schedule it!</Text>
          )}
        </TouchableOpacity>

        {/* Navigation Buttons */}
        <View style={styles.navigationButtons}>
          <TouchableOpacity style={styles.navButton} onPress={handleHome}>
            <Text style={styles.navButtonText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={handleBack}>
            <Text style={styles.navButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F8E9',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#222',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  calendarIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  datePlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  timeSlotsContainer: {
    gap: 10,
  },
  timeSlot: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: '#00C897',
    borderColor: '#00C897',
  },
  timeSlotText: {
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
  },
  selectedTimeSlotText: {
    color: '#fff',
    fontWeight: '600',
  },
  scheduleButton: {
    backgroundColor: '#00C897',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 30,
  },
  scheduleButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  navButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flex: 0.45,
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
