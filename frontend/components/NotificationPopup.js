import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import Loading from './Loading';
import { pickupAPI } from '../services/apiService';
import notificationService from '../services/notificationService';

// Calculate reward based on weight
const calculateReward = (weight) => {
  // weight is in kg
  // Base reward is 10 rupees
  let reward = 10;

  // Add 5 rupees for each kg, max 50 rupees
  reward += Math.min(Math.floor(weight) * 5, 40);

  return Math.min(reward, 50);
};

export default function NotificationPopup({ visible, notification, onClose, onAccept, onReject }) {
  const [timeLeft, setTimeLeft] = useState(20);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setTimeLeft(20);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAutoReject();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible]);

  const handleAutoReject = () => {
    if (onReject) {
      onReject(notification);
    }
    onClose();
  };

  const handleAccept = async () => {
    if (!notification || isAccepting) return;

    // Safety check for notification data
    if (!notification?.pickupData) {
      Alert.alert('Error', 'Invalid pickup data');
      return;
    }

    // Show confirmation dialog with estimated reward
    const reward = calculateReward(notification.pickupData.estimatedWeight || 0);
    Alert.alert(
      'Confirm Pickup',
      `Are you sure you want to accept this pickup?\nEstimated Reward: ₹${reward}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            setIsAccepting(false);
          }
        },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              setIsAccepting(true);
              // Accept the pickup request
              const response = await pickupAPI.acceptPickup(notification.pickupId || notification._id);

              if (response.status === 'success') {
                // Close popup first to prevent multiple accepts
                onClose();
                // Then notify parent component
                if (onAccept) {
                  onAccept(notification);
                }
              } else {
                Alert.alert('Error', response.message || 'Failed to accept pickup');
              }
            } catch (error) {
              console.error('Error accepting pickup:', error);
              Alert.alert('Error', 'Failed to accept pickup. Please try again.');
            } finally {
              setIsAccepting(false);
            }
          }
        }
      ],
      { cancelable: false }
    );
  };

  const handleReject = () => {
    if (!notification || isRejecting) return;

    try {
      setIsRejecting(true);

      // Just hide the notification - no backend call needed
      if (onReject) {
        onReject(notification);
      }

      onClose();
    } catch (error) {
      console.error('Reject pickup error:', error);
      Alert.alert('Error', 'Failed to reject pickup request');
    } finally {
      setIsRejecting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!notification) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>New Pickup Request</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Timer */}
          <View style={styles.timerContainer}>
            <Text style={[styles.timerText, timeLeft <= 5 && styles.timerTextUrgent]}>
              Auto-reject in: {formatTime(timeLeft)}
            </Text>
            <View style={[styles.timerBar, { width: `${(timeLeft / 20) * 100}%` }]} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>Pickup Request Available!</Text>
            <Text style={styles.subtitle}>
              Distance: {notification.distance || 'N/A'} km away
            </Text>

            {notification.pickupData && (
              <View style={styles.pickupInfo}>
                <Text style={styles.infoLabel}>Waste Type:</Text>
                <Text style={styles.infoValue}>{notification.pickupData.wasteType || 'Mixed'}</Text>

                <Text style={styles.infoLabel}>Estimated Weight:</Text>
                <Text style={styles.infoValue}>{notification.pickupData.estimatedWeight ? notification.pickupData.estimatedWeight * 1000 : 0} grams</Text>

                <Text style={styles.infoLabel}>Potential Earnings:</Text>
                <Text style={styles.infoValue}>₹{notification.pickupData.earnings || '50-150'}</Text>
              </View>
            )}
          </View>

          {/* Loading Indicator */}
          {(isAccepting || isRejecting) && (
            <View style={styles.loadingOverlay}>
              <Loading text={isAccepting ? 'Accepting...' : 'Rejecting...'} overlay />
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.rejectButton, isRejecting && styles.buttonDisabled]}
              onPress={handleReject}
              disabled={isRejecting}
            >
              <Text style={styles.rejectButtonText}>
                {isRejecting ? 'Rejecting...' : 'Reject'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.acceptButton, isAccepting && styles.buttonDisabled]}
              onPress={handleAccept}
              disabled={isAccepting}
            >
              <Text style={styles.acceptButtonText}>
                {isAccepting ? 'Accepting...' : 'Accept'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popup: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 0,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B5E20',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  timerContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 10,
  },
  timerTextUrgent: {
    color: '#f44336',
  },
  timerBar: {
    height: 4,
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  content: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  pickupInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B5E20',
    marginTop: 8,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#f44336',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
