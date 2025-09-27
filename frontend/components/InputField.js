import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, Platform } from 'react-native';
import { COLORS } from '../../theme/colors';

export default function InputField({ 
  label, 
  error, 
  containerStyle, 
  style,
  onBlur,
  onFocus,
  ...props 
}) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus && onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur && onBlur(e);
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.container,
        isFocused && styles.containerFocused,
        error && styles.containerError,
        !props.editable && styles.containerDisabled,
      ]}>
        <TextInput 
          placeholderTextColor={COLORS.textLight}
          style={[styles.input, style]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props} 
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 8,
  },
  label: { 
    fontSize: 14, 
    color: COLORS.text,
    marginBottom: 6,
    fontWeight: '600'
  },
  container: {
    borderRadius: 12,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  containerFocused: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.15,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  containerError: {
    borderColor: COLORS.error,
  },
  containerDisabled: {
    backgroundColor: COLORS.backgroundLight,
    borderColor: COLORS.border,
  },
  input: { 
    height: 40, 
    fontSize: 16,
    color: COLORS.text,
    padding: 0,
    margin: 0,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  }
});
