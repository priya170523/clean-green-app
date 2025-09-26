import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Card from '../components/Card';
import { userAPI } from '../services/apiService';
import { authService } from '../services/authService';

export default function DeliveryEarnings({ navigation }) {
  const [user, setUser] = useState(null);
  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarningsData();
  }, []);

  const loadEarningsData = async () => {
    try {
      setLoading(true);

      // Get current user
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);

      // Get earnings data
      const response = await userAPI.getDashboard();

      if (response.status === 'success') {
        setEarningsData(response.data);
      }
    } catch (error) {
      console.error('Error loading earnings:', error);
      Alert.alert('Error', 'Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleProfile = () => {
    navigation.navigate('DeliveryProfile');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Earnings</Text>
        <TouchableOpacity style={styles.profileIcon} onPress={handleProfile}>
          <Text style={styles.profileIconText}>👤</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Total Earnings Card */}
        <View style={styles.totalEarningsCard}>
          <Text style={styles.totalEarningsLabel}>Total Earnings</Text>
          <Text style={styles.totalEarningsAmount}>
            ₹{user?.earnings?.total || 0}
          </Text>
          <Text style={styles.totalEarningsSubtext}>
            Total Waste Submitted: {user?.totalWaste || 0} kg
            {user?.completedPickups ? `
Total Pickups: ${user.completedPickups}` : ''}
          </Text>
        </View>

        {/* Today's Earnings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Earnings</Text>
          <View style={styles.earningsCard}>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Today's Waste:</Text>
              <Text style={styles.earningsValue}>{earningsData?.todayWaste || 0} kg</Text>
            </View>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Amount Earned:</Text>
              <Text style={styles.earningsValue}>₹{earningsData?.todayEarnings || 0}</Text>
            </View>
          </View>
        </View>

        {/* This Week's Earnings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week's Earnings</Text>
          <View style={styles.earningsCard}>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Week's Waste:</Text>
              <Text style={styles.earningsValue}>{earningsData?.weekWaste || 0} kg</Text>
            </View>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Amount Earned:</Text>
              <Text style={styles.earningsValue}>₹{earningsData?.weekEarnings || 0}</Text>
            </View>
          </View>
        </View>

        {/* This Month's Earnings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Month's Earnings</Text>
          <View style={styles.earningsCard}>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Pickups Completed:</Text>
              <Text style={styles.earningsValue}>{earningsData?.monthPickups || 0}</Text>
            </View>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Amount Earned:</Text>
              <Text style={styles.earningsValue}>₹{earningsData?.monthEarnings || 0}</Text>
            </View>
          </View>
        </View>

        {/* Earnings Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings Breakdown</Text>
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Base Rate per Pickup:</Text>
              <Text style={styles.breakdownValue}>₹50</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Distance Bonus:</Text>
              <Text style={styles.breakdownValue}>₹20</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Performance Bonus:</Text>
              <Text style={styles.breakdownValue}>₹10</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownTotalLabel}>Total per Pickup:</Text>
              <Text style={styles.breakdownTotalValue}>₹80</Text>
            </View>
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <View style={styles.paymentCard}>
            <Text style={styles.paymentInfo}>
              💳 Payments are processed weekly and transferred to your registered bank account
            </Text>
            <Text style={styles.paymentInfo}>
              📅 Next payment: Every Friday
            </Text>
            <Text style={styles.paymentInfo}>
              🏦 Minimum payout: ₹500
            </Text>
          </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backText: {
    fontSize: 16,
    color: '#4CAF50',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconText: {
    fontSize: 18,
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  totalEarningsCard: {
    backgroundColor: '#4CAF50',
    padding: 25,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  totalEarningsLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
  },
  totalEarningsAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  totalEarningsSubtext: {
    fontSize: 14,
    color: '#e8f5e8',
    textAlign: 'center',
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
  earningsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  earningsLabel: {
    fontSize: 16,
    color: '#666',
  },
  earningsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  breakdownCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  breakdownTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  breakdownTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  paymentCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  paymentInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
});
