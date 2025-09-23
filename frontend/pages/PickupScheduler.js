import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '../components/Button';
import { dummyDeliveryAgents } from '../services/dummyData';

export default function PickupScheduler({ navigation }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [wasteType, setWasteType] = useState('');

  const timeSlots = [
    '9:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '2:00 PM - 3:00 PM',
    '3:00 PM - 4:00 PM',
    '4:00 PM - 5:00 PM',
  ];

  const wasteTypes = [
    { id: 'food', label: 'Food Waste', icon: '🍎' },
    { id: 'plastic', label: 'Plastic', icon: '🥤' },
    { id: 'paper', label: 'Paper', icon: '📄' },
    { id: 'glass', label: 'Glass', icon: '🍾' },
    { id: 'metal', label: 'Metal', icon: '🥫' },
    { id: 'other', label: 'Other', icon: '🗑️' },
  ];

  const handleSchedule = () => {
    if (!selectedDate || !selectedTime || !wasteType) {
      Alert.alert('Missing Information', 'Please select date, time, and waste type');
      return;
    }

    // Auto-assign a dummy delivery agent
    const assignedAgent = dummyDeliveryAgents[Math.floor(Math.random() * dummyDeliveryAgents.length)];

    Alert.alert(
      'Pickup Scheduled!',
      `Your ${wasteType} pickup is scheduled for ${selectedDate} at ${selectedTime}\n\n` +
      `📋 Delivery Agent Assigned:\n` +
      `👤 ${assignedAgent.name}\n` +
      `📞 ${assignedAgent.phone}\n` +
      `⭐ Rating: ${assignedAgent.rating}/5\n` +
      `🚗 ${assignedAgent.vehicle} (${assignedAgent.vehicleNumber})\n\n` +
      `✅ No need to wait for admin approval!`,
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Dashboard')
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule Pickup</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>Today: {new Date().toLocaleDateString()}</Text>
            <Text style={styles.dateText}>Tomorrow: {new Date(Date.now() + 86400000).toLocaleDateString()}</Text>
          </View>
          <View style={styles.dateButtons}>
            <TouchableOpacity 
              style={[styles.dateButton, selectedDate === 'today' && styles.selectedDateButton]}
              onPress={() => setSelectedDate('today')}
            >
              <Text style={[styles.dateButtonText, selectedDate === 'today' && styles.selectedDateButtonText]}>
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dateButton, selectedDate === 'tomorrow' && styles.selectedDateButton]}
              onPress={() => setSelectedDate('tomorrow')}
            >
              <Text style={[styles.dateButtonText, selectedDate === 'tomorrow' && styles.selectedDateButtonText]}>
                Tomorrow
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time Slot</Text>
          <View style={styles.timeContainer}>
            {timeSlots.map((slot, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.timeButton, selectedTime === slot && styles.selectedTimeButton]}
                onPress={() => setSelectedTime(slot)}
              >
                <Text style={[styles.timeButtonText, selectedTime === slot && styles.selectedTimeButtonText]}>
                  {slot}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Waste Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Waste Type</Text>
          <View style={styles.wasteTypeContainer}>
            {wasteTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[styles.wasteTypeButton, wasteType === type.id && styles.selectedWasteTypeButton]}
                onPress={() => setWasteType(type.id)}
              >
                <Text style={styles.wasteTypeIcon}>{type.icon}</Text>
                <Text style={[styles.wasteTypeText, wasteType === type.id && styles.selectedWasteTypeText]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Schedule Button */}
        <View style={styles.actionContainer}>
          <Button
            title="Schedule Pickup"
            onPress={handleSchedule}
            style={styles.scheduleButton}
          />
        </View>
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
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B5E20',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B5E20',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 20,
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
  dateContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dateButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedDateButton: {
    backgroundColor: '#4CAF50',
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  selectedDateButtonText: {
    color: '#fff',
  },
  timeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: '45%',
  },
  selectedTimeButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  selectedTimeButtonText: {
    color: '#fff',
  },
  wasteTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  wasteTypeButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: '28%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedWasteTypeButton: {
    backgroundColor: '#4CAF50',
  },
  wasteTypeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  wasteTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  selectedWasteTypeText: {
    color: '#fff',
  },
  actionContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  scheduleButton: {
    backgroundColor: '#4CAF50',
  },
});