import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { COLORS } from '../../theme/colors';

export default function Header({ 
  title, 
  onBack, 
  onAction, 
  actionText, 
  actionIcon,
  style,
  showProfile = false,
  onProfilePress
}) {
  const statusBarHeight = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;

  return (
    <View style={[styles.header, { paddingTop: statusBarHeight + 10 }, style]}>
      <View style={styles.leftContainer}>
        {onBack && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.title} numberOfLines={1}>{title}</Text>

      <View style={styles.rightContainer}>
        {actionText && (
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={onAction}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {actionIcon}
            <Text style={styles.actionText}>{actionText}</Text>
          </TouchableOpacity>
        )}
        {showProfile && (
          <TouchableOpacity 
            style={styles.profileButton} 
            onPress={onProfilePress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 1000,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  leftContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  rightContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  backText: {
    fontSize: 20,
    color: COLORS.primary,
    fontWeight: '600',
  },
  title: {
    flex: 2,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  actionText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  profileButton: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  profileIcon: {
    fontSize: 20,
  },
});