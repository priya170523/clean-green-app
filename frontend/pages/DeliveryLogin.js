import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../services/authService';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { COLORS } from '../../theme/colors';

export default function DeliveryLogin({ navigation }) {
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
        role: 'delivery'
      };

      const response = await authService.login(loginData);

      if (response.success) {
        if (response.data?.user?.role !== 'delivery') {
          Alert.alert('Access Denied', 'This app is for delivery agents only. Please use the user app if you are a regular user.');
          return;
        }
        navigation.replace('DeliveryMain');
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
    navigation.navigate('DeliverySignup');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.screenPad}>
        <View style={styles.topTitleRow}>
          <Text style={styles.screenTitle}>DeliveryLogin</Text>
        </View>

        <View style={styles.illustrationCircle}>
          <Text style={{ fontSize: 36 }}>🚚</Text>
        </View>
        <Text style={styles.brandTitle}>CleanGreen Delivery</Text>
        <Text style={styles.brandSubtitle}>Login to start delivering with CleanGreen</Text>

        <View style={styles.cardBox}>
          <Text style={styles.cardHeading}>Delivery Login</Text>

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

          <View style={styles.signupRow}>
            <Text style={styles.mutedText}>Don't have an account? </Text>
            <TouchableOpacity onPress={goToSignup}>
              <Text style={styles.linkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={{ alignItems: 'center', marginTop: 12 }}>
            <Text style={styles.linkText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#EEF7EE',
    paddingBottom: 24,
  },
  screenPad: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  topTitleRow: {
    marginBottom: 8,
  },
  screenTitle: {
    fontSize: 20,
    color: COLORS.secondaryDark,
  },
  illustrationCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E2F2E2',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  brandTitle: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
  },
  brandSubtitle: {
    textAlign: 'center',
    color: COLORS.secondaryDark,
    marginTop: 6,
    marginBottom: 14,
  },
  cardBox: {
    backgroundColor: '#EAF6EA',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeading: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    marginTop: 8,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 14,
  },
  mutedText: {
    color: COLORS.secondaryDark,
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});