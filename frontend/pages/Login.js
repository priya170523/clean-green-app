import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated } from 'react-native';
import { DevSettings } from 'react-native';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { authService } from '../services/authService';

export default function Login({ navigation }) {
  const [tab, setTab] = useState('login');
  const [role, setRole] = useState('user');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [switchAnim] = useState(new Animated.Value(0));
  const [showSplash, setShowSplash] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
        role: role
      };

      const response = await authService.login(loginData);

      if (response.success) {
        if (role === 'user') {
          navigation.replace('Main');
        } else {
          navigation.replace('DeliveryMain');
        }
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

  const handleSignup = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const signupData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: role
      };

      const response = await authService.register(signupData);

      if (response.success) {
        Alert.alert('Success', 'Account created successfully! Please login.');
        setTab('login');
      } else {
        Alert.alert('Registration Failed', response.message || 'Failed to create account');
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchRole = (newRole) => {
    if (newRole === role) return;
    setShowSplash(true);
    setTimeout(() => {
      Animated.sequence([
        Animated.timing(switchAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(switchAnim, { toValue: 0, duration: 200, useNativeDriver: true })
      ]).start(() => {
        setRole(newRole);
        setTab('login');
        setFormData({ email: '', password: '', name: '', phone: '' });
        DevSettings.reload();
        setShowSplash(false);
      });
    }, 350); // Splash duration
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      {showSplash && (
        <View style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: '#4CAF50',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10
        }}>
          <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}>CleanGreen</Text>
        </View>
      )}
      {/* Header */}
      <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>🌱</Text>
          </View>
          <Text style={styles.logoTitle}>CleanGreen</Text>
        </View>
        <Text style={styles.headerSubtitle}>Come join hands & stay a key role in Green INDIA</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Role Selection */}
        <View style={styles.roleSelector}>
          <TouchableOpacity
            style={[styles.roleTab, role === 'user' && styles.activeRoleTab]}
            onPress={() => switchRole('user')}
          >
            <Animated.View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              transform: [
                { translateX: switchAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [role === 'user' ? 0 : 50, 0]
                  }) }
              ]
            }}>
              <Text style={{ fontSize: 24, marginRight: 8 }}>👤</Text>
              <Text style={[styles.roleTabText, role === 'user' && styles.activeRoleTabText]}>User</Text>
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleTab, role === 'delivery' && styles.activeRoleTab]}
            onPress={() => switchRole('delivery')}
          >
            <Animated.View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              transform: [
                { translateX: switchAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [role === 'delivery' ? 0 : -50, 0]
                  }) }
              ]
            }}>
              <Text style={{ fontSize: 24, marginRight: 8 }}>🚚</Text>
              <Text style={[styles.roleTabText, role === 'delivery' && styles.activeRoleTabText]}>Delivery Agent</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Login Form */}
        {!showSplash && (
        <Animated.View style={[styles.formContainer, {
          opacity: switchAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.5] }),
          transform: [{ scale: switchAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.98] }) }]
        }]}>        
          <View style={styles.tabRow}>
            <TouchableOpacity onPress={() => setTab('login')}>
              <Text style={[styles.tab, tab === 'login' && styles.activeTab]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTab('register')}>
              <Text style={[styles.tab, tab === 'register' && styles.activeTab]}>Register</Text>
            </TouchableOpacity>
          </View>

          {tab === 'login' ? (
            <View style={styles.form}>
              <InputField
                label="Email"
                placeholder="Enter your email"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                style={styles.inputField}
              />
              <InputField
                label="Password"
                secureTextEntry
                placeholder="Enter your password"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                style={styles.inputField}
              />
              <Button
                title={loading ? "Logging in..." : "Login"}
                onPress={handleLogin}
                style={styles.loginButton}
                disabled={loading}
              />
              <TouchableOpacity onPress={() => alert('Forgot password flow placeholder')} style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <InputField
                label="Full Name"
                placeholder="Enter your full name"
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                style={styles.inputField}
              />
              <InputField
                label="Email"
                keyboardType="email-address"
                placeholder="Enter your email"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                style={styles.inputField}
              />
              <InputField
                label="Phone"
                keyboardType="phone-pad"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                style={styles.inputField}
              />
              <InputField
                label="Password"
                secureTextEntry
                placeholder="Create a password"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                style={styles.inputField}
              />
              <Button
                title={loading ? "Creating Account..." : "Create Account"}
                onPress={handleSignup}
                style={styles.registerButton}
                disabled={loading}
              />
            </View>
          )}

          <View style={styles.signupPrompt}>
            <Text style={styles.signupText}>
              {tab === 'login' ? "Don't have an account? " : "Already have an account? "}
            </Text>
            <TouchableOpacity onPress={() => setTab(tab === 'login' ? 'register' : 'login')}>
              <Text style={styles.signupLink}>
                {tab === 'login' ? 'Signup' : 'Login'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E9', // Light Green background
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoText: {
    fontSize: 28,
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 30,
  },
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 4,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeRoleTab: {
    backgroundColor: '#4CAF50', // Primary Green
  },
  roleTabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeRoleTabText: {
    color: '#fff',
  },
  formContainer: {
    backgroundColor: '#C8E6C9', // Medium Green card background
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    marginHorizontal: 20,
    fontSize: 16,
    color: '#666',
    paddingBottom: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeTab: {
    color: '#fff',
    backgroundColor: '#4CAF50', // Primary Green
  },
  form: {
    marginBottom: 20,
  },
  inputField: {
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: '#4CAF50', // Primary Green
    marginTop: 12,
  },
  registerButton: {
    backgroundColor: '#4CAF50', // Primary Green
    marginTop: 12,
  },
  forgotPassword: {
    marginTop: 16,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#2E7D32', // Dark Green
    fontSize: 14,
    fontWeight: '500',
  },
  signupPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signupText: {
    color: '#666', // Gray Text
    fontSize: 14,
  },
  signupLink: {
    color: '#2E7D32', // Dark Green
    fontSize: 14,
    fontWeight: '600',
  },
});
