import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Image } from 'react-native';

const SEGMENTS = [
  { id: 1, type: 'money', value: 2, color: '#FF0000' }, // Red
  { id: 2, type: 'seeds', value: 1, color: '#FFD700' }, // Yellow
  { id: 3, type: 'money', value: 3, color: '#00FF00' }, // Green
  { id: 4, type: 'money', value: 4, color: '#0000FF' }, // Blue
  { id: 5, type: 'seeds', value: 2, color: '#00FFFF' }, // Cyan
  { id: 6, type: 'money', value: 2, color: '#800080' }, // Purple
  { id: 7, type: 'money', value: 3, color: '#FFA500' }, // Orange
  { id: 8, type: 'seeds', value: 1, color: '#FF69B4' }  // Pink
];

const SEGMENT_DEGREE = 360 / SEGMENTS.length;

export default function SpinningWheel({ onSpinComplete }) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const spinValue = useRef(new Animated.Value(0)).current;

  const spin = () => {
    if (isSpinning) return;
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
        style={[styles.spinButton, isSpinning && styles.spinButtonDisabled]}
        onPress={spin}
        disabled={isSpinning}
      >
        <Text style={styles.spinButtonText}>
          {isSpinning ? 'Spinning...' : 'SPIN!'}
        </Text>
      </TouchableOpacity>

      {/* Result display */}
      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>
            You won: {result.type === 'money' ? `₹${result.value}` : 'Seeds'}!
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
