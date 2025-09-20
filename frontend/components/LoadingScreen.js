import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export default function LoadingScreen() {
  const rotateValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    rotateAnimation.start();

    return () => rotateAnimation.stop();
  }, []);

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.Text 
        style={[
          styles.recycleIcon,
          { transform: [{ rotate }] }
        ]}
      >
        ♻️
      </Animated.Text>
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F8E9', // Very light green
  },
  recycleIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#2E7D32', // Dark Green
    fontWeight: '600',
  },
});
