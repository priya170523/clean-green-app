import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Loading from './Loading';
import { COLORS } from '../../theme/colors';

export default function LoadingScreen({ 
  text = 'Loading...',
  size = 'large',
  overlay = false,
}) {
  const rotateValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 0.8,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    );

    rotateAnimation.start();
    pulseAnimation.start();

    return () => {
      rotateAnimation.stop();
      pulseAnimation.stop();
    };
  }, []);

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, overlay && styles.overlay]}>
      <View style={styles.content}>
        <Animated.Text 
          style={[
            styles.recycleIcon,
            { 
              transform: [
                { rotate },
                { scale: scaleValue }
              ],
            }
          ]}
          accessible={true}
          accessibilityLabel="Loading indicator"
          accessibilityRole="progressbar"
        >
          ♻️
        </Animated.Text>
        <Animated.Text 
          style={[styles.loadingText, { opacity: scaleValue }]}
          accessible={true}
          accessibilityLabel={text}
        >
          {text}
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 999,
  },
  content: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
  },
  recycleIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
});
