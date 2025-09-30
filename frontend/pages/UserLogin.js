import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { authService } from '../services/authService';
import { COLORS } from '../../theme/colors';

export default function UserLogin({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const loginData = {
        email: formData.email,
        password: formData.password,
        role: 'user'
      };

      const response = await authService.login(loginData);

      if (response.success) {
        if (response.data?.user?.role !== 'user') {
          Alert.alert('Access Denied', 'This app is for users only. Please use the delivery app if you are a delivery agent.');
          return;
        }
        navigation.replace('Main');
      } else {
        Alert.alert('Login Failed', response.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goToSignup = () => {
    navigation.navigate('UserSignup');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LinearGradient colors={[COLORS.primary, '#2E7D32']} style={styles.headerCard}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🌱</Text>
        </View>
        <Text style={styles.appName}>CleanGreen</Text>
        <Text style={styles.slogan}>Welcome User! Stay a key role in Green INDIA</Text>
      </LinearGradient>

      <View style={styles.formCard}>
        <InputField
          placeholder="Enter your email"
          value={formData.email}
          onChangeText={(value) => handleInputChange('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <InputField
          placeholder="Enter your password"
          value={formData.password}
          onChangeText={(value) => handleInputChange('password', value)}
          secureTextEntry
        />

        <Button
          title={loading ? "Logging in..." : "Login"}
          onPress={handleLogin}
          style={styles.primaryButton}
          disabled={loading}
        />

        <TouchableOpacity style={styles.centerLink} onPress={() => {}}>
          <Text style={styles.linkText}>Forgot password?</Text>
        </TouchableOpacity>

        <View style={styles.signupRow}>
          <Text style={styles.mutedText}>Don't have an account? </Text>
          <TouchableOpacity onPress={goToSignup}>
            <Text style={styles.linkText}>Signup</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#E8F5E9',
    paddingBottom: 24,
  },
  headerCard: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 24,
    alignItems: 'center',
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoEmoji: {
    fontSize: 32,
  },
  appName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  slogan: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
    textAlign: 'center',
  },
  formCard: {
    marginTop: 24,
    marginHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    marginTop: 4,
  },
  centerLink: {
    alignItems: 'center',
    marginTop: 10,
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  mutedText: {
    color: COLORS.secondaryDark,
  },
});