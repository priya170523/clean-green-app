import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';

const SEGMENTS = [
  { id: 1, type: 'money', value: 2, color: '#4CAF50' },
  { id: 2, type: 'money', value: 3, color: '#2196F3' },
  { id: 3, type: 'seeds', value: 1, color: '#FFC107' },
  { id: 4, type: 'money', value: 2, color: '#4CAF50' },
  { id: 5, type: 'money', value: 3, color: '#2196F3' },
  { id: 6, type: 'seeds', value: 1, color: '#FFC107' }
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
        <View style={styles.wheel}>
          {SEGMENTS.map((segment, index) => {
            const rotation = index * SEGMENT_DEGREE;
            return (
              <View
                key={segment.id}
                style={[
                  styles.segment,
                  {
                    backgroundColor: segment.color,
                    transform: [{ rotate: `${rotation}deg` }]
                  }
                ]}
              >
                <Text style={styles.segmentText}>
                  {segment.type === 'money' ? `₹${segment.value}` : `${segment.value} Seeds`}
                </Text>
              </View>
            );
          })}
        </View>
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
  segment: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderTopLeftRadius: 150,
    borderTopRightRadius: 150,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  segmentText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    transform: [{ rotate: '-60deg' }],
  },
});
