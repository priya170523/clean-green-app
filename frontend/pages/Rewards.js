import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { rewardAPI } from '../services/apiService';
import SpinningWheel from '../components/SpinningWheel';
import * as Progress from 'react-native-progress';

export default function Rewards({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState([]);
  const [showWheel, setShowWheel] = useState(false);
  const [canSpin, setCanSpin] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
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
      const [rewardsRes, earnedRes, progressRes] = await Promise.all([
        rewardAPI.getRewards(1, 20, 'active'),
        rewardAPI.getRewards(1, 20, 'all'),
        rewardAPI.getProgress()
      ]);

      if (rewardsRes.status === 'success') {
        setRewards(rewardsRes.data.rewards || rewardsRes.data || []);
      }

      if (earnedRes.status === 'success') {
        setEarnedRewards(earnedRes.data.rewards || earnedRes.data || []);
      }

      if (progressRes.status === 'success') {
        setTotalPoints(progressRes.data.totalPoints || 0);
        setCurrentLevel(progressRes.data.currentLevel || 1);

        // Show wheel only if user has submitted waste and hasn't spun yet
        const canSpinNow = progressRes.data.canSpin;
        setShowWheel(canSpinNow);
        setCanSpin(canSpinNow);

        // If there's a first-time coupon, add it to earned rewards
        if (progressRes.data.firstTimeCoupon) {
          const firstTimeCouponReward = {
            _id: `firsttime_${Date.now()}`,
            title: 'First-Time Pickup Bonus',
            description: 'Welcome bonus for your first waste submission!',
            couponCode: progressRes.data.firstTimeCoupon.code,
            discount: '₹50 OFF',
            type: 'first_time',
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          };
          setEarnedRewards(prev => [
            ...prev.filter(r => r.type !== 'first_time'), // Remove any existing first-time coupon
            firstTimeCouponReward
          ]);
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
    if (isSpinning || !canSpin) return; // Prevent multiple spins

    try {
      setIsSpinning(true); // Lock spinning while API call is in progress
      setCanSpin(false); // Immediately disable spin button
      setShowWheel(false); // Hide wheel immediately to prevent further spins

      const response = await rewardAPI.claimWheelReward({ value: result.value, type: result.type });
      if (response.status === 'success') {
        // Add the new reward to earned list immediately
        const newReward = {
          ...response.data,
          title: `Spin Reward: ${result.type === 'coupon' ? `₹${result.value} OFF` : result.type === 'cashback' ? `₹${result.value} Cashback` : result.type === 'seeds' ? `${result.value} Seeds` : result.type === 'plant' ? '1 Plant' : result.type === 'vermicompost' ? `${result.value} Vermicompost` : result.type === 'gift' ? '1 Gift' : `₹${result.value} OFF`}`,
          description: `You won ${result.type === 'coupon' ? `₹${result.value} discount` : result.type === 'cashback' ? `₹${result.value} cashback` : result.type === 'seeds' ? `${result.value} seeds` : result.type === 'plant' ? '1 plant' : result.type === 'vermicompost' ? `${result.value} vermicompost` : result.type === 'gift' ? '1 gift' : `₹${result.value} discount`}!`,
          type: 'spin_reward'
        };
        setEarnedRewards(prev => [...prev, newReward]);
        loadRewards(); // Reload to update progress and confirm backend state
        Alert.alert('Congratulations!', `You won ${result.type === 'coupon' ? `₹${result.value} discount` : result.type === 'cashback' ? `₹${result.value} cashback` : result.type === 'seeds' ? `${result.value} seeds` : result.type === 'plant' ? '1 plant' : result.type === 'vermicompost' ? `${result.value} vermicompost` : result.type === 'gift' ? '1 gift' : `₹${result.value} discount`}!\nCheck your rewards list for details.`);
      }
    } catch (error) {
      console.error('Error claiming wheel reward:', error);
      Alert.alert('Error', 'Failed to claim reward. Please try again.');
      // On error, reload to check if spin was actually processed
      loadRewards();
    } finally {
      setIsSpinning(false); // Always reset spinning state
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

        {/* Spinning Wheel */}
        {showWheel && (
          <View style={styles.wheelContainer}>
            <Text style={styles.wheelTitle}>Spin the wheel to claim your reward!</Text>
            <SpinningWheel 
              onSpinComplete={handleSpinComplete} 
              disabled={!canSpin || isSpinning} 
            />
            <Text style={styles.wheelInfoText}>
              {!canSpin
                ? 'Spin is locked. Submit waste to unlock, or you have already spun for this cycle.'
                : isSpinning
                ? 'Processing your spin...'
                : 'Spin the wheel to win rewards! (Unlocked after submitting waste)'}
            </Text>
          </View>
        )}

        {/* Rewards List - Showing Earned Rewards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Earned Rewards</Text>
          {loading ? (
            <ActivityIndicator />
          ) : (
            <View style={styles.rewardsContainer}>
              {earnedRewards.length === 0 ? (
                <Text style={{ color: '#666' }}>No earned rewards yet. Submit waste to unlock spins and rewards!</Text>
              ) : (
                earnedRewards.map((reward) => (
                  <View key={reward._id || reward.id} style={styles.rewardItemColumn}>
                    <Text style={styles.rewardDescription}>{reward.title}</Text>
                    <Text style={styles.rewardDetail}>{reward.description}</Text>
                    {reward.couponCode && (
                      <View style={styles.couponCardRow}>
                        <Text style={styles.couponText}>Code: {reward.couponCode}</Text>
                      </View>
                    )}
                    {reward.discount && (
                      <Text style={styles.rewardDetail}>Discount: {reward.discount}</Text>
                    )}
                    {reward.expiryDate && (
                      <Text style={styles.rewardDetail}>Expires: {new Date(reward.expiryDate).toLocaleDateString()}</Text>
                    )}
                    <TouchableOpacity 
                      style={styles.redeemButtonFull} 
                      onPress={() => Alert.alert('Redeem', `Use coupon ${reward.couponCode || 'reward'} at checkout for ${reward.discount || 'your prize'}`)}
                      disabled={!reward.couponCode}
                    >
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
