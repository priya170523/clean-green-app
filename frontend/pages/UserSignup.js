import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { authService } from '../services/authService';

export default function UserSignup({ navigation, forcedRole }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignup = async () => {
    // Basic validation
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: forcedRole === 'delivery' ? 'delivery' : 'user'
      };

      const result = await authService.register(userData);
      
      if (result.success) {
        Alert.alert('Success', 'Account created successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.replace(forcedRole === 'delivery' ? 'DeliveryMain' : 'Main')
          }
        ]);
      } else {
        Alert.alert('Registration Failed', result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'Registration failed. Please try again.');
    }
  };

  const handleHelp = () => {
    alert('Help feature coming soon!');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>🌱</Text>
            </View>
            <Text style={styles.logoTitle}>CleanGreen</Text>
          </View>
          <Text style={styles.motivationalText}>
            {forcedRole === 'delivery' ? 'Join our Delivery Partners and earn with CleanGreen.' : 'Hurray! First Step towards Green India.'}
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>
              {forcedRole === 'delivery' ? 'Create Delivery Account' : 'Create Your Account'}
            </Text>
            
            <InputField 
              label="Name" 
              placeholder="Enter your full name"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              style={styles.inputField}
            />
            
            <InputField 
              label="Email" 
              keyboardType="email-address"
              placeholder="Enter your email address"
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
              label="Alternate Phone" 
              keyboardType="phone-pad"
              placeholder="Enter alternate phone number"
              value={formData.alternatePhone}
              onChangeText={(value) => handleInputChange('alternatePhone', value)}
              style={styles.inputField}
            />
            
            <InputField 
              label="Address" 
              placeholder="Enter your address"
              value={formData.address}
              onChangeText={(value) => handleInputChange('address', value)}
              style={styles.inputField}
              multiline
              numberOfLines={3}
            />
            
            <InputField 
              label="Password" 
              secureTextEntry 
              placeholder="Create a secure password"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              style={styles.inputField}
            />
            
            <InputField 
              label="Confirm Password" 
              secureTextEntry 
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              style={styles.inputField}
            />

            <Button 
              title="Create Account" 
              onPress={handleSignup} 
              style={styles.signupButton}
            />

            <TouchableOpacity onPress={handleHelp} style={styles.helpButton}>
              <Text style={styles.helpText}>Help</Text>
            </TouchableOpacity>

            <View style={styles.loginPrompt}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.loginLink}>Login</Text>
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
    backgroundColor: '#F1F8E9', // Very very light green background
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
    fontSize: 28,
    fontWeight: '800',
    color: '#2E7D32', // Dark Green
  },
  motivationalText: {
    fontSize: 18,
    color: '#2E7D32', // Dark Green
    fontWeight: '600',
    textAlign: 'center',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1B5E20', // Deep Green
    textAlign: 'center',
    marginBottom: 24,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  inputField: {
    marginBottom: 16,
  },
  signupButton: {
    backgroundColor: '#1B5E20', // Dark green for create account
    marginTop: 20,
    marginBottom: 16,
  },
  helpButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  helpText: {
    color: '#2E7D32', // Dark Green
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#666', // Gray Text
    fontSize: 14,
  },
  loginLink: {
    color: '#2E7D32', // Dark Green
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
