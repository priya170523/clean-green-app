import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Card from '../components/Card';
import { dummyDeliveryDashboardData, dummyNotifications } from '../services/dummyData';

export default function DeliveryDashboard({ navigation }) {
  const [isOnline, setIsOnline] = useState(false);
  const [dashboardData, setDashboardData] = useState(dummyDeliveryDashboardData);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load initial dashboard data
    setDashboardData(dummyDeliveryDashboardData);
  }, []);

  const handleToggleOnline = () => {
    const newOnlineStatus = !isOnline;
    setIsOnline(newOnlineStatus);

    if (newOnlineStatus) {
      // Simulate going online and receiving notifications
      Alert.alert('Online', 'You are now online and will receive pickup notifications');

      // Show dummy notifications after a short delay
      setTimeout(() => {
        const randomNotifications = dummyNotifications.slice(0, 2);
        setNotifications(randomNotifications);

        // Show first notification as alert
        if (randomNotifications.length > 0) {
          const notification = randomNotifications[0];
          Alert.alert(
            notification.title,
            notification.message,
            [
              { text: 'Reject', style: 'cancel' },
              { text: 'Accept', onPress: () => handleNotificationAccept(notification) }
            ]
          );
        }
      }, 2000);
    } else {
      Alert.alert('Offline', 'You are now offline');
      setNotifications([]);
    }
  };

  const handleNotificationAccept = (notification) => {
    // Navigate to route page with pickup data
    navigation.navigate('DeliveryRoutePage', {
      pickupData: notification.pickupData
    });
  };

  const handleNotificationReject = (notification) => {
    // Just remove the notification from the list
    setNotifications(prev => prev.filter(n => n !== notification));
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
    backgroundColor: '#f5f5f5',
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
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconText: {
    fontSize: 24,
    color: '#333',
  },
  onlineButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
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
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4CAF50',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4CAF50',
    marginRight: 4,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#fff',
    width: '48%',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  actionButtonIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },

  notificationCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  notificationIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  notificationText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  supportButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  supportButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  notificationEarnings: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
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
    backgroundColor: '#4CAF50',
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


