import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { deliveryAPI, pickupAPI } from '../services/apiService';
import { notificationService } from '../services/notificationService';
import authService from '../services/authService';
import * as Location from 'expo-location';

export default function DeliveryDashboard({ navigation }) {
  const [isOnline, setIsOnline] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    todayPickups: 0,
    todayEarnings: 0,
    totalEarnings: 0,
    completedDeliveries: 0,
    rating: { average: 0, total: 0 }
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get current user and initialize notification socket
    (async () => {
      const user = await authService.getCurrentUser();
      if (user && user._id) {
        notificationService.init(user._id);
        notificationService.joinDeliveryRoom(user._id);
      } else {
        notificationService.init(); // fallback
      }
      // Setup notification listeners after socket is initialized
      notificationService.onNewPickupAvailable((data) => {
        if (isOnline) {
          const notification = {
            id: data.pickup._id,
            type: 'pickup_request',
            title: 'New Pickup Request',
            message: `Pickup available ${data.message}`,
            pickupData: data.pickup,
            earnings: `₹${data.pickup.earnings || '50-150'}`
          };
          setNotifications(prev => [...prev, notification]);
          Alert.alert(
            notification.title,
            notification.message,
            [
              { text: 'Reject', style: 'cancel', onPress: () => handleNotificationReject(notification) },
              { text: 'Accept', onPress: () => handleNotificationAccept(notification) }
            ]
          );
        }
      });
      notificationService.onPickupRequest((data) => {
        if (isOnline) {
          const notification = {
            id: data.pickup._id,
            type: 'pickup_request',
            title: 'Pickup Request',
            message: `Pickup request: ${data.message}`,
            pickupData: data.pickup,
            earnings: `₹${data.pickup.earnings || '50-150'}`
          };
          setNotifications(prev => [...prev, notification]);
          Alert.alert(
            notification.title,
            notification.message,
            [
              { text: 'Reject', style: 'cancel', onPress: () => handleNotificationReject(notification) },
              { text: 'Accept', onPress: () => handleNotificationAccept(notification) }
            ]
          );
        }
      });
      // Listen for agent status updates
      if (notificationService.getSocket()) {
        notificationService.getSocket().on('agent-status-update', (data) => {
          Alert.alert('Status Update', data.message || 'Your status has changed.');
        });
      }
      // Listen for pickup-admin-approved
      if (notificationService.getSocket()) {
        notificationService.getSocket().on('pickup-admin-approved', (data) => {
          Alert.alert('Pickup Approved', 'A pickup request has been approved and is now available');
        });
      }
    })();
    loadDashboardData();
  }, [isOnline]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const earnings = await deliveryAPI.getEarnings();
      const pickups = await deliveryAPI.getMyPickups('all');

      const today = new Date().toDateString();
      const todayPickups = pickups.data?.pickups?.filter(p =>
        new Date(p.createdAt).toDateString() === today
      ) || [];

      setDashboardData({
        todayPickups: todayPickups.length,
        todayEarnings: todayPickups.reduce((sum, p) => sum + (p.earnings || 0), 0),
        totalEarnings: earnings.data?.totalEarnings || 0,
        completedDeliveries: pickups.data?.pickups?.filter(p => p.status === 'completed').length || 0,
        rating: earnings.data?.rating || { average: 0, total: 0 }
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    // Deprecated: now handled in useEffect after socket initialization
  };

  const handleToggleOnline = async () => {
    const newOnlineStatus = !isOnline;
    setIsOnline(newOnlineStatus);

    try {
      await deliveryAPI.updateOnlineStatus(newOnlineStatus);

      if (newOnlineStatus) {
        Alert.alert('Online', 'You are now online and will receive pickup notifications');
        loadDashboardData(); // Refresh data when going online
      } else {
        Alert.alert('Offline', 'You are now offline');
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error updating online status:', error);
      Alert.alert('Error', 'Failed to update online status');
      setIsOnline(!newOnlineStatus); // Revert state on error
    }
  };

  // Get agent's current location and pass to route page
  const handleNotificationAccept = async (notification) => {
    try {
      // Get current location
      let location = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          location = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
        }
      } catch (e) {
        console.warn('Location error:', e);
      }
      await pickupAPI.acceptPickup(notification.pickupData._id);
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      navigation.navigate('DeliveryRoutePage', {
        pickupData: notification.pickupData,
        agentLocation: location
      });
    } catch (error) {
      console.error('Error accepting pickup:', error);
      Alert.alert('Error', 'Failed to accept pickup');
    }
  };

  const handleNotificationReject = (notification) => {
    setNotifications(prev => prev.filter(n => n.id !== notification.id));
  };

  const handleProfile = () => {
    navigation.navigate('DeliveryProfile');
  };

  const handleEarnings = () => {
    navigation.navigate('DeliveryEarnings');
  };

  const handleSupport = () => {
    navigation.navigate('Support');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileIcon} onPress={handleProfile}>
          <Text style={styles.profileIconText}>👤</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.onlineButton, isOnline && styles.onlineButtonActive]}
          onPress={handleToggleOnline}
        >
          <Text style={[styles.onlineButtonText, isOnline && styles.onlineButtonTextActive]}>
            {isOnline ? 'Go Offline' : 'Go Online'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome back!</Text>
          <Text style={styles.welcomeSubtitle}>
            Ready for your next pickup?
          </Text>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? '#4CAF50' : '#f44336' }]} />
            <Text style={styles.statusText}>
              {isOnline ? 'Online - Receiving notifications' : 'Offline'}
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Pickups Completed</Text>
            <Text style={styles.statValue}>{dashboardData.completedDeliveries}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Earnings</Text>
            <Text style={styles.currencySymbol}>₹</Text>
            <Text style={styles.statValue}>{dashboardData.totalEarnings}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleEarnings}>
              <Text style={styles.actionButtonIcon}>💰</Text>
              <Text style={styles.actionButtonText}>View Earnings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleProfile}>
              <Text style={styles.actionButtonIcon}>👤</Text>
              <Text style={styles.actionButtonText}>My Profile</Text>
            </TouchableOpacity>
          </View>
        </View>



        {/* Active Notifications */}
        {notifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Notifications</Text>
            {notifications.map((notification, index) => (
              <View key={index} style={styles.notificationCard}>
                <Text style={styles.notificationIcon}>🔔</Text>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationMessage}>{notification.message}</Text>
                  <Text style={styles.notificationEarnings}>Earnings: {notification.earnings}</Text>
                  <View style={styles.notificationActions}>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleNotificationReject(notification)}
                    >
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleNotificationAccept(notification)}
                    >
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Notification Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.notificationCard}>
            <Text style={styles.notificationIcon}>🔔</Text>
            <Text style={styles.notificationText}>
              {isOnline
                ? 'You will receive notifications for new pickup requests'
                : 'Go online to receive pickup notifications'
              }
            </Text>
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.supportButton} onPress={handleSupport}>
            <Text style={styles.supportButtonIcon}>💬</Text>
            <Text style={styles.supportButtonText}>Need Help? Contact Support</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8f5e9', // light green
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#c8e6c9', // lighter green
    shadowColor: '#388e3c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#a5d6a7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#66bb6a',
    shadowColor: '#388e3c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  profileIconText: {
    fontSize: 24,
    color: '#388e3c',
    fontWeight: 'bold',
  },
  onlineButton: {
    backgroundColor: '#66bb6a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#388e3c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  onlineButtonActive: {
    backgroundColor: '#f44336',
  },
  onlineButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  onlineButtonTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeSection: {
    marginBottom: 25,
    backgroundColor: '#c8e6c9',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#388e3c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#388e3c',
    marginBottom: 8,
    textShadowColor: '#a5d6a7',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#66bb6a',
    marginBottom: 10,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
    backgroundColor: '#388e3c',
  },
  statusText: {
    fontSize: 14,
    color: '#388e3c',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    flex: 1,
    marginHorizontal: 6,
    alignItems: 'center',
    shadowColor: '#388e3c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#c8e6c9',
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#388e3c',
    marginBottom: 8,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#43a047',
    textShadowColor: '#c8e6c9',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: '#43a047',
    marginRight: 4,
  },
  section: {
    marginBottom: 25,
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#388e3c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#388e3c',
    marginBottom: 15,
    textShadowColor: '#a5d6a7',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#c8e6c9',
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#a5d6a7',
    elevation: 2,
    shadowColor: '#388e3c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
  },
  actionButtonIcon: {
    fontSize: 30,
    marginBottom: 8,
    color: '#388e3c',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#388e3c',
    textAlign: 'center',
  },
  notificationCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#388e3c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    borderWidth: 2,
    borderColor: '#c8e6c9',
  },
  notificationIcon: {
    fontSize: 24,
    marginRight: 15,
    color: '#43a047',
  },
  notificationText: {
    fontSize: 14,
    color: '#388e3c',
    flex: 1,
    lineHeight: 20,
  },
  supportButton: {
    backgroundColor: '#c8e6c9',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#388e3c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    borderWidth: 2,
    borderColor: '#a5d6a7',
  },
  supportButtonIcon: {
    fontSize: 20,
    marginRight: 10,
    color: '#388e3c',
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#388e3c',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#388e3c',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#66bb6a',
    marginBottom: 4,
  },
  notificationEarnings: {
    fontSize: 14,
    fontWeight: '600',
    color: '#43a047',
    marginBottom: 8,
  },
  notificationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  rejectButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: '#43a047',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});


