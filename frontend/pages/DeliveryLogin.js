import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import InputField from '../components/InputField';
import Button from '../components/Button';

export default function DeliveryLogin({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please enter both username and password');
      return;
    }
    try {
      // Replace with real backend authentication
      // const result = await authService.login(email, password);
      // if (result.success) {
      //   navigation.replace('DeliveryMain');
      // } else {
      //   alert(result.message || 'Login failed');
      // }
      // Demo fallback:
      if (email === 'delivery@cleangreen.com' && password === 'delivery123') {
        navigation.replace('DeliveryMain');
      } else {
        alert('Invalid delivery credentials');
      }
    } catch (error) {
      alert('Login error. Please try again.');
    }
  };

  const handleSignup = () => {
    navigation.navigate('DeliverySignup');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>🚚</Text>
            </View>
            <Text style={styles.logoTitle}>CleanGreen Delivery</Text>
          </View>
          <Text style={styles.motivationalText}>Come join hands & play a key role in Green INDIA</Text>
        </View>

        <View style={styles.content}>
        {/* Login Form */}
        <View style={styles.formContainer}>
          <InputField 
            label="Username" 
            placeholder="Enter your username"
            value={email}
            onChangeText={setEmail}
            style={styles.inputField}
          />
          <InputField 
            label="Password" 
            secureTextEntry 
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            style={styles.inputField}
          />
          <Button 
            title="Login" 
            onPress={handleLogin} 
            style={styles.loginButton}
          />
          
          <View style={styles.signupPrompt}>
            <Text style={styles.signupText}>Want to become our new hand then </Text>
            <TouchableOpacity onPress={handleSignup}>
              <Text style={styles.signupLink}>Signup</Text>
            </TouchableOpacity>
          </View>
        </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F1F8E9', // Very light green background
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9', // Light Green
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoText: {
    fontSize: 36,
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2E7D32', // Dark Green
  },
  motivationalText: {
    fontSize: 16,
    color: '#2E7D32', // Dark Green
    fontWeight: '600',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formContainer: {
    backgroundColor: '#E0F2E0', // Bit darker than background
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputField: {
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: '#4CAF50', // Primary Green
    marginTop: 12,
    marginBottom: 20,
  },
  signupPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: '#666', // Gray Text
    fontSize: 14,
  },
  signupLink: {
    color: '#2E7D32', // Dark Green
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

