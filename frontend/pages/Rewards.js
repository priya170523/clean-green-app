import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { rewardAPI } from '../services/apiService';
import SpinningWheel from '../components/SpinningWheel';
import * as Progress from 'react-native-progress';

export default function Rewards({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState([]);
  const [totalWaste, setTotalWaste] = useState(0);
  const [showWheel, setShowWheel] = useState(false);
  const [firstTimeCoupon, setFirstTimeCoupon] = useState(null);
  const [earnedRewards, setEarnedRewards] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [pointsToNextLevel, setPointsToNextLevel] = useState(100);

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    try {
      setLoading(true);
      const [rewardsRes, progressRes] = await Promise.all([
        rewardAPI.getRewards(1, 20, 'active'),
        rewardAPI.getProgress()
      ]);

      if (rewardsRes.status === 'success') {
        setRewards(rewardsRes.data.rewards || rewardsRes.data || []);
        setEarnedRewards(rewardsRes.data.earned || []);
      }

      if (progressRes.status === 'success') {
        setTotalWaste(progressRes.data.totalWaste || 0);
        setFirstTimeCoupon(progressRes.data.firstTimeCoupon);
        setTotalPoints(progressRes.data.points || 0);
        
        // Calculate level based on points
        const level = Math.floor(progressRes.data.points / 100) + 1;
        setUserLevel(level);
        setPointsToNextLevel((level * 100) - progressRes.data.points);
        
        // Show wheel if 2kg milestone reached
        if (progressRes.data.totalWaste >= 2 && !progressRes.data.wheelSpun) {
          setShowWheel(true);
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  const handleHome = () => {
    navigation.navigate('Dashboard');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSpinComplete = async (result) => {
    try {
      const response = await rewardAPI.claimWheelReward(result);
      if (response.status === 'success') {
        setEarnedRewards(prev => [...prev, response.data]);
        setShowWheel(false);
      }
    } catch (error) {
      console.error('Error claiming wheel reward:', error);
      Alert.alert('Error', 'Failed to claim reward');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Rewards</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Points and Level Section */}
        <View style={styles.pointsCard}>
          <View style={styles.pointsHeader}>
            <Text style={styles.pointsTitle}>Green Points</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Level {userLevel}</Text>
            </View>
          </View>
          <Text style={styles.pointsValue}>{totalPoints}</Text>
          <View style={styles.progressContainer}>
            <Progress.Bar
              progress={(100 - pointsToNextLevel) / 100}
              width={null}
              height={8}
              color="#4CAF50"
              unfilledColor="#E8F5E9"
              borderWidth={0}
            />
            <Text style={styles.progressText}>{pointsToNextLevel} points to next level</Text>
          </View>
        </View>

        {/* Waste Progress Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Waste Collection Progress</Text>
          <View style={styles.progressContainer}>
            <Progress.Circle
              size={120}
              progress={Math.min(totalWaste / 2, 1)}
              thickness={8}
              color="#4CAF50"
              unfilledColor="#E8F5E9"
              borderWidth={0}
              showsText
              formatText={() => `${totalWaste.toFixed(1)}kg`}
            />
            <Text style={styles.targetText}>Target: 2kg</Text>
          </View>
        </View>

        {/* First Time Coupon */}
        {firstTimeCoupon && (
          <View style={styles.couponContainer}>
            <Text style={styles.couponTitle}>First-Time Pickup Coupon</Text>
            <Text style={styles.couponValue}>₹50 OFF</Text>
            <Text style={styles.couponCode}>Code: {firstTimeCoupon.code}</Text>
          </View>
        )}

        {/* Spinning Wheel */}
        {showWheel && (
          <View style={styles.wheelContainer}>
            <Text style={styles.wheelTitle}>Congratulations! Spin the wheel to claim your reward!</Text>
            <SpinningWheel onSpinComplete={handleSpinComplete} />
          </View>
        )}

        {/* Rewards List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Rewards</Text>
          {loading ? (
            <ActivityIndicator />
          ) : (
            <View style={styles.rewardsContainer}>
              {rewards.length === 0 ? (
                <Text style={{ color: '#666' }}>No rewards yet.</Text>
              ) : (
                rewards.map((reward) => (
                  <View key={reward._id} style={styles.rewardItemColumn}>
                    <Text style={styles.rewardDescription}>{reward.title}</Text>
                    <Text style={styles.rewardDetail}>{reward.description}</Text>
                    <View style={styles.couponCardRow}>
                      <Text style={styles.couponText}>{reward.couponCode}</Text>
                    </View>
                    <TouchableOpacity style={styles.redeemButtonFull} onPress={() => Alert.alert('Redeem', 'Use this coupon at checkout')}>
                      <Text style={styles.redeemButtonText}>Redeem</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.section}>
          <View style={styles.navigationButtons}>
            <TouchableOpacity style={styles.navButton} onPress={handleBack}>
              <Text style={styles.navButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} onPress={handleHome}>
              <Text style={styles.navButtonText}>Home</Text>
            </TouchableOpacity>
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
  progressContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  progressText: {
    marginTop: 5,
    fontSize: 16,
    color: '#666',
  },
  couponContainer: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  couponTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  couponValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  couponCode: {
    color: '#fff',
    fontSize: 14,
  },
  wheelContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  wheelTitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    color: '#4CAF50',
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
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
    padding: 20,
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
  rewardsContainer: {
    marginBottom: 20,
  },
  rewardItemColumn: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  couponCard: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 6,
    marginRight: 15,
  },
  couponCardRow: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 8,
    alignItems: 'center'
  },
  couponText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  rewardDescription: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 4,
  },
  rewardDetail: {
    fontSize: 14,
    color: '#666',
  },
  redeemButtonFull: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 10,
    alignItems: 'center'
  },
  redeemButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flex: 0.45,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
