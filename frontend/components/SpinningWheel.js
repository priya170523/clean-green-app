import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Image } from 'react-native';

const SEGMENTS = [
  { id: 1, type: 'plant', value: 1, label: 'Plant', color: '#228B22' }, // Forest Green
  { id: 2, type: 'seeds', value: 1, label: 'Seeds', color: '#FFD700' }, // Gold
  { id: 3, type: 'vermicompost', value: 1, label: 'Vermicompost', color: '#8B4513' }, // Saddle Brown
  { id: 4, type: 'cashback', value: 50, label: '₹50 Cashback', color: '#FF0000' }, // Red
  { id: 5, type: 'coupon', value: 100, label: '₹100 Coupon', color: '#0000FF' }, // Blue
  { id: 6, type: 'gift', value: 1, label: 'Gift', color: '#800080' }  // Purple
];

const SEGMENT_DEGREE = 360 / SEGMENTS.length;


export default function SpinningWheel({ onSpinComplete, disabled }) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const spinValue = useRef(new Animated.Value(0)).current;

  const spin = () => {
    if (isSpinning || disabled) return;
    setIsSpinning(true);
    setResult(null);

    // Random number of full rotations (3-5) plus random segment
    const rotations = 3 + Math.random() * 2;
    const randomSegment = Math.floor(Math.random() * SEGMENTS.length);
    const targetRotation = (rotations * 360) + (randomSegment * SEGMENT_DEGREE);

    Animated.timing(spinValue, {
      toValue: targetRotation,
      duration: 3000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start(() => {
      setIsSpinning(false);
      const segment = SEGMENTS[randomSegment];
      setResult(segment);
      if (onSpinComplete) {
        onSpinComplete(segment);
      }
    });
  };

  const interpolatedSpin = spinValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.wheelContainer,
          { transform: [{ rotate: interpolatedSpin }] }
        ]}
      >
        <Image 
          source={require('../assets/spin-wheel.jpg')} 
          style={styles.wheel} 
          resizeMode="contain" 
        />
      </Animated.View>

      {/* Center pointer */}
      <View style={styles.centerPointer} />

      {/* Spin button */}
      <TouchableOpacity
        style={[styles.spinButton, (isSpinning || disabled) && styles.spinButtonDisabled]}
        onPress={spin}
        disabled={isSpinning || disabled}
      >
        <Text style={styles.spinButtonText}>
          {disabled ? 'Spin Locked' : (isSpinning ? 'Spinning...' : 'SPIN!')}
        </Text>
      </TouchableOpacity>

      {/* Result display */}
      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>
            You won: {result.label}!
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  wheelContainer: {
    position: 'relative',
  },
  wheel: {
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 2,
    borderColor: '#000',
  },
  centerPointer: {
    position: 'absolute',
    width: 20,
    height: 40,
    backgroundColor: '#FF5252',
    top: -20,
    zIndex: 1,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  spinButton: {
    marginTop: 30,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
  },
  spinButtonDisabled: {
    backgroundColor: '#ccc',
  },
  spinButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
  },
  resultText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
