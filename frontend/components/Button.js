import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../theme/colors';

export default function Button({ title, onPress, style, variant = 'primary' }) {
  const gradientColors =
    variant === 'primary' ? [COLORS.primary, COLORS.leaf] : [COLORS.accent, COLORS.accent]; // Primary Green or Warning Yellow

  return (
    <TouchableOpacity onPress={onPress} style={[styles.wrapper, style]}>
      <LinearGradient colors={gradientColors} style={styles.gradient}>
        <Text style={styles.text}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { 
    borderRadius: 12, 
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  text: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  }
});
