import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { COLORS } from '../../theme/colors';

export default function Card({ 
  children, 
  style, 
  onPress, 
  variant = 'default',
  disabled = false 
}) {
  const Container = onPress ? TouchableOpacity : View;
  const containerStyle = [
    styles.card,
    variant === 'outlined' && styles.cardOutlined,
    variant === 'elevated' && styles.cardElevated,
    disabled && styles.cardDisabled,
    style
  ];

  return (
    <Container 
      style={containerStyle}
      onPress={!disabled ? onPress : null}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityState={{ disabled }}
    >
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: Platform.OS === 'ios' ? 20 : 16,
    backgroundColor: COLORS.white,
    borderWidth: Platform.OS === 'ios' ? 0 : 1,
    borderColor: COLORS.border,
    marginHorizontal: 16,
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardOutlined: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  cardElevated: {
    backgroundColor: COLORS.white,
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  cardDisabled: {
    opacity: 0.6,
  },
});
