import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { rewardAPI } from '../services/apiService';
import SpinningWheel from '../components/SpinningWheel';
import * as Progress from 'react-native-progress';

export default function Rewards({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState([]);
  const [showWheel, setShowWheel] = useState(false);
  const [firstTimeCoupon, setFirstTimeCoupon] = useState(null);
  const [earnedRewards, setEarnedRewards] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [nextThreshold, setNextThreshold] = useState(200);
  const [levelProgress, setLevelProgress] = useState(0);

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
        setFirstTimeCoupon(progressRes.data.firstTimeCoupon);
        setTotalPoints(progressRes.data.totalPoints || 0);
        setCurrentLevel(progressRes.data.currentLevel || 1);

        // Show wheel if can spin (after every 2kg cycle)
        if (progressRes.data.canSpin) {
          setShowWheel(true);
        }

        const levelInfo = getLevelAndNext(progressRes.data.totalPoints || 0);
        setNextThreshold(levelInfo.nextThreshold);
        setLevelProgress(levelInfo.progress);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  function getLevelAndNext(points) {
    let level = 1;
    let threshold = 200;
    let prevThreshold = 0;

    while (points > threshold && level < 10) {
      prevThreshold = threshold;
      threshold *= 2;
      level++;
    }

    const progress = level === 1 ? points / threshold : (points - prevThreshold) / (threshold - prevThreshold);
    return { level, nextThreshold: threshold, progress: Math.min(progress, 1) };
  }

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
        loadRewards(); // Reload to update progress
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
        {/* Level Progress Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Level Progress</Text>
          <View style={styles.levelContainer}>
            <Text style={styles.levelText}>Level {currentLevel}</Text>
            <Progress.Bar
              progress={levelProgress}
              width={300}
              height={10}
              color="#9C27B0"
              unfilledColor="#E8F5E9"
              borderWidth={0}
            />
            <Text style={styles.pointsText}>{totalPoints} / {nextThreshold} points</Text>
            <Text style={styles.couponMention}>Level up to get a special coupon!</Text>
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
  levelContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  levelText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9C27B0',
    marginBottom: 10,
  },
  pointsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  couponMention: {
    fontSize: 14,
    color: '#4CAF50',
    fontStyle: 'italic',
    marginTop: 5,
  },
});
