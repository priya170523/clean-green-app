import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { COLORS } from '../../theme/colors';
import * as ImagePicker from 'expo-image-picker';
import { uploadAPI } from '../services/uploadService';

export default function DeliverySignup({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    email: '',
    password: '',
    phone: '',
    vehicle: '',
    license: '',
    aadhar: '',
    aadharImageUrl: '',
    licenseImageUrl: '',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickAndUpload = async (type) => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
      if (res.canceled) return;
      const uri = res.assets?.[0]?.uri;
      if (!uri) return;
      // Delivery signup happens before auth; use public upload (no token)
      const result = await uploadAPI.uploadDocument(uri, type, { requiresAuth: false });
      if (result.success) {
        if (type === 'aadhar') setFormData(p => ({ ...p, aadharImageUrl: result.data.url }));
        if (type === 'license') setFormData(p => ({ ...p, licenseImageUrl: result.data.url }));
        Alert.alert('Uploaded', `${type} uploaded successfully`);
      } else {
        Alert.alert('Upload failed', result.message || 'Try again');
      }
    } catch (e) {
      Alert.alert('Upload failed', e.message);
    }
  };

  const handleCreate = async () => {
    if (!acceptTerms) {
      Alert.alert('Required', 'Please accept the terms & conditions');
      return;
    }
    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      Alert.alert('Missing info', 'Name, Email, Password and Phone are required');
      return;
    }
    setLoading(true);
    try {
      // Reuse existing signup endpoint via authService
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: 'delivery',
        profile: {
          age: formData.age,
          vehicle: formData.vehicle,
          license: formData.license,
          aadhar: formData.aadhar,
          aadharImageUrl: formData.aadharImageUrl,
          licenseImageUrl: formData.licenseImageUrl,
        }
      };
      // Lazy import to avoid circular deps
      const { authService } = await import('../services/authService');
      const res = await authService.register(payload);
      if (res.success) {
        Alert.alert('Success', 'Account created successfully', [{ text: 'OK', onPress: () => navigation.replace('DeliveryMain') }]);
      } else {
        Alert.alert('Failed', res.message || 'Could not create account');
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerArea}>
        <View style={styles.logoCircle}><Text style={{ fontSize: 32 }}>🚚</Text></View>
        <Text style={styles.brand}>CleanGreen Delivery</Text>
        <Text style={styles.tagline}>To become our hand verify yourself first ↓</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Delivery Registration</Text>

        <InputField placeholder="Enter full name" value={formData.name} onChangeText={v => handleInputChange('name', v)} />
        <InputField placeholder="Enter age" keyboardType="numeric" value={formData.age} onChangeText={v => handleInputChange('age', v)} />
        <InputField placeholder="Enter email" keyboardType="email-address" autoCapitalize="none" value={formData.email} onChangeText={v => handleInputChange('email', v)} />
        <InputField placeholder="Create password" secureTextEntry value={formData.password} onChangeText={v => handleInputChange('password', v)} />
        <InputField placeholder="Enter phone" keyboardType="phone-pad" value={formData.phone} onChangeText={v => handleInputChange('phone', v)} />
        <InputField placeholder="Select vehicle" value={formData.vehicle} onChangeText={v => handleInputChange('vehicle', v)} />
        <InputField placeholder="Enter license" value={formData.license} onChangeText={v => handleInputChange('license', v)} />
        <InputField placeholder="Enter Aadhar" value={formData.aadhar} onChangeText={v => handleInputChange('aadhar', v)} />

        <Text style={styles.sectionTitle}>Upload Documents</Text>
        <View style={styles.row}>
          <Button title="Upload Aadhar" onPress={() => pickAndUpload('aadhar')} style={styles.uploadBtn} />
          <Button title="Upload License" onPress={() => pickAndUpload('license')} style={styles.uploadBtn} />
        </View>
        <Text style={styles.helper}>Please upload clear images of documents (JPEG or PNG)</Text>

        <View style={styles.termsRow}>
          <TouchableOpacity onPress={() => setAcceptTerms(v => !v)} style={styles.checkbox}>
            <View style={[styles.checkboxBox, acceptTerms && styles.checkboxChecked]} />
          </TouchableOpacity>
          <Text style={styles.termsText}>I accept & understand the terms & conditions</Text>
        </View>

        <Button title={loading ? 'Creating...' : 'Create Account'} onPress={handleCreate} disabled={loading} style={styles.primaryBtn} />

        <View style={styles.loginRow}>
          <Text style={styles.muted}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.link}>Login</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.footerNote}>Crafted with love towards India</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#EEF7EE', paddingBottom: 24, paddingHorizontal: 16 },
  headerArea: { alignItems: 'center', paddingTop: 8, paddingBottom: 12 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E2F2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  brand: { fontSize: 28, fontWeight: '900', color: COLORS.primary },
  tagline: { color: COLORS.secondaryDark, marginTop: 8, fontStyle: 'italic' },
  card: { backgroundColor: '#EAF6EA', borderRadius: 16, padding: 16, marginTop: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  cardTitle: { textAlign: 'center', fontSize: 24, fontWeight: '900', color: COLORS.primary, marginBottom: 12 },
  sectionTitle: { marginTop: 10, marginBottom: 8, color: COLORS.primary, fontWeight: '800' },
  row: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  uploadBtn: { flex: 1, backgroundColor: COLORS.primary },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  checkbox: { marginRight: 8 },
  checkboxBox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: COLORS.primary, backgroundColor: 'transparent' },
  checkboxChecked: { backgroundColor: COLORS.primary },
  primaryBtn: { backgroundColor: COLORS.primary, borderRadius: 12, marginTop: 12 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  muted: { color: COLORS.secondaryDark },
  link: { color: COLORS.primary, fontWeight: '700' },
  footerNote: { textAlign: 'center', color: COLORS.secondaryDark, marginTop: 16 },
});
