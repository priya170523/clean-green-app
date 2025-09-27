import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Card from './Card';
import { COLORS } from '../../theme/colors';

export default function StatCard({ label, value, icon, color = COLORS.primary }) {
  return (
    <Card style={styles.container}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: 'center',
    marginHorizontal: 4,
    minHeight: 100,
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  icon: {
    fontSize: 24,
    marginBottom: 8,
  },
  value: { 
    fontSize: 24, 
    fontWeight: '800', 
    marginBottom: 8,
    color: COLORS.text
  },
  label: { 
    fontSize: 13, 
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 4
  }
});
