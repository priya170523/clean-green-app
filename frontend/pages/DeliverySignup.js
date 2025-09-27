import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Alert,
  ActivityIndicator
} from 'react-native';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { uploadAPI } from '../services/uploadService';
import { authService } from '../services/authService';
import { COLORS } from '../../theme/colors';
import * as ImagePicker from 'expo-image-picker';

export default function DeliverySignup({ navigation }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    email: '',
    phone: '',
    password: '',
    vehicleType: '',
    bikeType: '',
    licenseNo: '',
    aadharNo: '',
    termsAccepted: false
  });
  const [documents, setDocuments] = useState({
    aadhar: { url: '', publicId: '' },
    license: { url: '', publicId: '' }
  });
  const [uploadingDoc, setUploadingDoc] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignup = async () => {
    if (!formData.name || !formData.age || !formData.email || !formData.phone || !formData.password ||
        !formData.vehicleType || !formData.licenseNo || !formData.aadharNo) {
      alert('Please fill in all required fields');
      return;
    }
    if (!documents.aadhar.url || !documents.license.url) {
      alert('Please upload both Aadhar and License documents');
      return;
    }
    if (!formData.termsAccepted) {
      alert('Please accept the terms and conditions');
      return;
    }
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: 'delivery',
        vehicleType: formData.vehicleType,
        bikeType: formData.bikeType,
        licenseNumber: formData.licenseNo,
        aadharNumber: formData.aadharNo,
        documents: {
          aadhar: documents.aadhar,
          license: documents.license
        }
      };
      const res = await authService.register(payload);
      if (res.success) {
        Alert.alert('Success', 'Delivery account created successfully! Please login.');
        navigation.goBack();
      } else {
        Alert.alert('Registration Failed', res.message || 'Failed to create account');
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Registration failed');
    }
  };

  const selectVehicleType = () => {
    Alert.alert('Vehicle Type', 'Choose one', [
      { text: 'Bike', onPress: () => setFormData(prev => ({ ...prev, vehicleType: 'bike' })) },
      { text: 'Scooter', onPress: () => setFormData(prev => ({ ...prev, vehicleType: 'scooter' })) },
      { text: 'Car', onPress: () => setFormData(prev => ({ ...prev, vehicleType: 'car' })) },
      { text: 'Van', onPress: () => setFormData(prev => ({ ...prev, vehicleType: 'van' })) },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };
  const selectBikeType = () => {
    Alert.alert('Bike Type', 'Choose one', [
      { text: '100cc', onPress: () => setFormData(prev => ({ ...prev, bikeType: '100cc' })) },
      { text: '125cc', onPress: () => setFormData(prev => ({ ...prev, bikeType: '125cc' })) },
      { text: '150cc', onPress: () => setFormData(prev => ({ ...prev, bikeType: '150cc' })) },
      { text: 'Electric', onPress: () => setFormData(prev => ({ ...prev, bikeType: 'electric' })) },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const renderDocumentButton = (type) => {
    const isUploading = uploadingDoc === type;
    const hasDocument = !!documents[type]?.url;

    return (
      <TouchableOpacity
        style={[styles.docButton, hasDocument && styles.docButtonSuccess]}
        onPress={() => uploadDoc(type)}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <>
            <Text style={styles.docButtonText}>
              {hasDocument ? `${type.charAt(0).toUpperCase() + type.slice(1)} Uploaded` : `Upload ${type.charAt(0).toUpperCase() + type.slice(1)}`}
            </Text>
            {hasDocument && (
              <Text style={styles.docButtonSubtext}>Tap to change</Text>
            )}
          </>
        )}
      </TouchableOpacity>
    );
  };

  const uploadDoc = async (kind) => {
    try {
      setUploadingDoc(kind);

      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload documents.');
        return;
      }

      // Launch image picker with updated API (fix deprecation warning)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: [ImagePicker.MediaType.IMAGE],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.4, // Further reduced quality for faster upload
        exif: false,
        base64: false,
        allowsMultipleSelection: false,
      });

      if (result.canceled || !result.assets?.[0]?.uri) {
        setUploadingDoc('');
        return;
      }

      const uri = result.assets[0].uri;

      // Upload document
      const res = await uploadAPI.uploadDocument(uri, kind);
      
      if (res.success && res.data?.url) {
        setDocuments(prev => ({
          ...prev,
          [kind]: {
            url: res.data.url,
            publicId: res.data.publicId
          }
        }));
        Alert.alert('Success', `${kind.charAt(0).toUpperCase() + kind.slice(1)} uploaded successfully`);
      } else {
        throw new Error(res.message || 'Upload failed');
      }
    } catch (error) {
      console.error(`Error uploading ${kind}:`, error);
      Alert.alert('Upload Failed', error.message || 'Please try again');
    } finally {
      setUploadingDoc('');
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
              <Text style={styles.logoText}>🚚</Text>
            </View>
            <Text style={styles.logoTitle}>CleanGreen Delivery</Text>
          </View>
          <Text style={styles.instructionText}>To become our hand verify yourself first ↓</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Delivery Registration</Text>
            
            <InputField 
              label="Name" 
              placeholder="Enter your full name"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              style={styles.inputField}
            />
            
            <InputField 
              label="Age" 
              keyboardType="numeric"
              placeholder="Enter your age"
              value={formData.age}
              onChangeText={(value) => handleInputChange('age', value)}
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
              label="Password" 
              secureTextEntry
              placeholder="Create a password"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              style={styles.inputField}
            />
            
            <InputField 
              label="Phone Number" 
              keyboardType="phone-pad"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              style={styles.inputField}
            />
            
            <TouchableOpacity onPress={selectVehicleType}>
              <InputField 
                label="Type of Vehicle" 
                placeholder="Select vehicle type"
                value={formData.vehicleType}
                editable={false}
                style={styles.inputField}
              />
            </TouchableOpacity>
            
            {formData.vehicleType === 'bike' || formData.vehicleType === 'scooter' ? (
              <TouchableOpacity onPress={selectBikeType}>
                <InputField 
                  label="Type of Bike" 
                  placeholder="Select bike type"
                  value={formData.bikeType}
                  editable={false}
                  style={styles.inputField}
                />
              </TouchableOpacity>
            ) : null}
            
            <InputField 
              label="License Number" 
              placeholder="Enter license number"
              value={formData.licenseNo}
              onChangeText={(value) => handleInputChange('licenseNo', value)}
              style={styles.inputField}
            />
            
            <InputField 
              label="Aadhar Number" 
              keyboardType="numeric"
              placeholder="Enter Aadhar number"
              value={formData.aadharNo}
              onChangeText={(value) => handleInputChange('aadharNo', value)}
              style={styles.inputField}
            />

            <View style={styles.documentsSection}>
              <Text style={styles.documentsTitle}>Upload Documents</Text>
              <View style={styles.documentButtons}>
                {renderDocumentButton('aadhar')}
                {renderDocumentButton('license')}
              </View>
              <Text style={styles.uploadNote}>Please upload clear images of your documents (JPEG or PNG)</Text>
            </View>

            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => handleInputChange('termsAccepted', !formData.termsAccepted)}
            >
              <View style={[styles.checkbox, formData.termsAccepted && styles.checkboxChecked]}>
                {formData.termsAccepted && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxText}>I accept & understand the terms & conditions</Text>
            </TouchableOpacity>

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

            <Text style={styles.footerText}>Crafted with love towards India</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  scrollView: {
    flex: 1
  },
  content: {
    padding: 20
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: 'center'
  },
  vehicleSelector: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  vehicleSelectorText: {
    color: COLORS.text,
    fontSize: 16,
  },
  documentsSection: {
    marginVertical: 20,
  },
  documentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  documentButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  docButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docButtonSuccess: {
    backgroundColor: COLORS.success,
  },
  docButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
  docButtonSubtext: {
    color: COLORS.white,
    fontSize: 12,
    marginTop: 4,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 4,
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
  },
  termsText: {
    color: COLORS.text,
    fontSize: 14,
  },
  signupButton: {
    marginVertical: 20,
  },
  loginLink: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loginLinkText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  uploadNote: {
    color: COLORS.gray,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  documentButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  docButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docButtonSuccess: {
    backgroundColor: COLORS.success,
  },
  docButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
  docButtonSubtext: {
    color: COLORS.white,
    fontSize: 12,
    marginTop: 4,
  },
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
    fontSize: 24,
    fontWeight: '800',
    color: '#2E7D32', // Dark Green
  },
  instructionText: {
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
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1B5E20', // Deep Green
    textAlign: 'center',
    marginBottom: 24,
  },
  inputField: {
    marginBottom: 16,
  },
  uploadSection: {
    marginBottom: 16,
  },
  uploadLabel: {
    fontSize: 14,
    color: '#1B5E20', // Deep Green
    marginBottom: 8,
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#4CAF50', // Primary Green
    marginBottom: 4,
  },
  uploadNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#2E7D32', // Dark Green
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2E7D32', // Dark Green
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: '#1B5E20', // Deep Green
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
    marginBottom: 16,
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
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});
