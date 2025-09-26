import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, RefreshControl } from 'react-native';
import { pickupAPI } from '../services/apiService';
import { notificationService } from '../services/notificationService';

export default function ScheduledPage({ navigation }) {
  const [liveSchedules, setLiveSchedules] = useState([]);
  const [scheduledHistory, setScheduledHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSchedules();

    // Listen for pickup notifications
    const onPickupAccepted = (data) => {
      Alert.alert('Pickup Accepted!', `Your pickup has been accepted by ${data.agent?.name || 'an agent'}.`);
      loadSchedules(); // Refresh data
    };

    const onPickupCompleted = (data) => {
      Alert.alert('Pickup Completed!', `Your pickup has been completed! You earned ${data.points || 0} points.`);
      loadSchedules(); // Refresh data
    };

    notificationService.onPickupAccepted(onPickupAccepted);
    notificationService.onPickupCompleted(onPickupCompleted);

    // Cleanup listeners on unmount
    return () => {
      // Note: notificationService doesn't have removeListener, but since it's global, it's fine
    };
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  const loadSchedules = async () => {
    try {
      setLoading(true);

      // Get all pickups
      const response = await pickupAPI.getUserPickups('all');
      if (response.status === 'success') {
        const all = response.data.pickups || [];
        
        // Set live schedules
        setLiveSchedules(all.filter(p => ['awaiting_agent', 'accepted', 'in_progress'].includes(p.status))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        
        // Set history
        setScheduledHistory(all.filter(p => ['completed', 'admin_rejected', 'cancelled'].includes(p.status))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
      Alert.alert('Error', 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleProfile = () => {
    navigation.navigate('Profile');
  };

  const handleViewSchedule = (schedule) => {
    const statusLabels = {
      awaiting_agent: 'Awaiting Agent',
      accepted: 'Agent Assigned',
      in_progress: 'In Progress',
      completed: 'Completed',
      admin_rejected: 'Rejected',
      cancelled: 'Cancelled'
    };

    Alert.alert('Schedule Details', 
      `Status: ${statusLabels[schedule.status] || schedule.status}
` +
      `Type: ${schedule.wasteDetails?.type || 'Mixed'}
` +
      `Weight: ${schedule.wasteDetails?.quantity || 0} kg
` +
      `Scheduled for: ${formatDate(schedule.scheduledDate || schedule.createdAt)}
` +
      `Address: ${schedule.address?.fullAddress || 'Not specified'}
` +
      (schedule.agent ? `Agent: ${schedule.agent.name || 'Not assigned'}
` : '') +
      (schedule.notes ? `Notes: ${schedule.notes}` : '')
    );
  };

  const handleViewHistory = (history) => {
    const statusLabels = {
      awaiting_agent: 'Awaiting Agent',
      accepted: 'Agent Assigned',
      in_progress: 'In Progress',
      completed: 'Completed',
      admin_rejected: 'Rejected',
      cancelled: 'Cancelled'
    };

    Alert.alert('History Details',
      `Status: ${statusLabels[history.status] || history.status}
` +
      `Type: ${history.wasteType || 'Mixed'}
` +
      `Weight: ${history.estimatedWeight || 0} kg
` +
      `Completed on: ${formatDate(history.completedAt || history.scheduledDate || history.createdAt)}
` +
      `Address: ${history.address?.fullAddress || 'Not specified'}
` +
      (history.agent ? `Agent: ${history.agent.name || 'Not assigned'}
` : '') +
      (history.notes ? `Notes: ${history.notes}` : '')
    );
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadSchedules().finally(() => setRefreshing(false));
  }, []);

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#4CAF50']} // Android
          tintColor="#4CAF50" // iOS
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileIcon} onPress={handleProfile}>
          <Text style={styles.profileIconText}>👤</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Schedules</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Live Schedules Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live schedules</Text>
          {loading ? (
            <Text style={styles.loadingText}>Loading schedules...</Text>
          ) : liveSchedules.length > 0 ? (
            liveSchedules.map((schedule) => (
              <View key={schedule._id || schedule.id} style={styles.scheduleCard}>
                <View style={styles.scheduleInfo}>
                  <Text style={styles.scheduleType}>
                    {schedule.wasteDetails?.type?.toUpperCase() || 'MIXED WASTE'}
                  </Text>
                  <Text style={styles.scheduleWeight}>
                    Weight: {schedule.wasteDetails?.quantity || 0} kg
                  </Text>
                  <Text style={styles.scheduleTime}>
                    {formatDate(schedule.scheduledDate || schedule.createdAt)}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    {
                      backgroundColor: {
                        'awaiting_agent': '#FF9800',
                        'accepted': '#4CAF50',
                        'in_progress': '#2196F3',
                        'completed': '#4CAF50',
                        'admin_rejected': '#F44336',
                        'cancelled': '#9E9E9E'
                      }[schedule.status] || '#FF5722'
                    }
                  ]}>
                    <Text style={styles.statusText}>
                      {{
                        'awaiting_agent': 'Awaiting Agent',
                        'accepted': 'Agent Assigned',
                        'in_progress': 'In Progress',
                        'completed': 'Completed',
                        'admin_rejected': 'Rejected',
                        'cancelled': 'Cancelled'
                      }[schedule.status] || 'Pending'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => handleViewSchedule(schedule)}
                >
                  <Text style={styles.viewButtonText}>view</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No live schedules found</Text>
          )}
        </View>

        {/* Scheduled History Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>History</Text>
          {loading ? (
            <Text style={styles.loadingText}>Loading history...</Text>
          ) : scheduledHistory.length > 0 ? (
            scheduledHistory.map((history) => (
              <View key={history._id || history.id} style={styles.scheduleCard}>
                <View style={styles.scheduleInfo}>
                  <Text style={styles.scheduleType}>
                    {history.wasteType?.toUpperCase() || 'MIXED WASTE'}
                  </Text>
                  <Text style={styles.scheduleWeight}>
                    Weight: {history.estimatedWeight || 0} kg
                  </Text>
                  <Text style={styles.scheduleTime}>
                    {formatDate(history.completedAt || history.scheduledDate || history.createdAt)}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    {
                      backgroundColor: {
                        'completed': '#4CAF50',
                        'admin_rejected': '#F44336',
                        'cancelled': '#9E9E9E'
                      }[history.status] || '#FF5722'
                    }
                  ]}>
                    <Text style={styles.statusText}>
                      {{
                        'completed': 'Completed',
                        'admin_rejected': 'Rejected',
                        'cancelled': 'Cancelled'
                      }[history.status] || 'Unknown'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => handleViewHistory(history)}
                >
                  <Text style={styles.viewButtonText}>view</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No history found</Text>
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>crafted with love toward india</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F8E9', // Very light green background
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
  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconText: {
    fontSize: 24,
    color: '#2E7D32',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B5E20',
  },
  placeholder: {
    width: 50,
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
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
  scheduleCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 4,
  },
  scheduleWeight: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  scheduleTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  viewButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});
