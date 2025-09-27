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
      activeOpacity={0.8}
    >
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
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
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardDisabled: {
    opacity: 0.6,
  },
});
