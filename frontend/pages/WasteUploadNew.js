import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { uploadAPI, pickupAPI, addressAPI } from '../services/apiService';
import { authService } from '../services/authService';
import Loading from '../components/Loading';

export default function WasteUploadNew({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [images, setImages] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);

  // Form state
  const [wasteType, setWasteType] = useState('');
  const [wasteDetails, setWasteDetails] = useState({
    bottles: 0,
    otherItems: '',
  });
  const [estimatedWeight, setEstimatedWeight] = useState('');

  const [priority, setPriority] = useState('now');

  // Convert grams to kg for API
  const convertToKg = (grams) => {
    if (!grams) return 0;
    return Number((parseFloat(grams) / 1000).toFixed(2));
  };
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [scheduledTime, setScheduledTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initData = async () => {
      try {
        setLoading(true);
        
        // Check if user is authenticated first
        const isAuth = await authService.isAuthenticated();
        if (!isAuth) {
          if (mounted) {
            Alert.alert(
              'Authentication Required',
              'Please log in to continue',
              [
                {
                  text: 'OK',
                  onPress: () => navigation.navigate('Auth')
                }
              ]
            );
          }
          return;
        }

        // Get current user
        const user = await authService.getCurrentUser();
        if (mounted) {
          setCurrentUser(user);
          // Load user's addresses
          await loadAddresses();
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        if (mounted) {
          Alert.alert(
            'Error',
            'Failed to load user data. Please try logging in again.',
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('Auth')
              }
            ]
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initData();

    return () => {
      mounted = false;
    };
  }, []);

  const initializeData = async () => {
    try {
      setLoading(true);

      // Get current user
      const user = await authService.getCurrentUser();
      setCurrentUser(user);

      // Load user's addresses
      await loadAddresses();

    } catch (error) {
      console.error('Error initializing data:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const loadAddresses = async () => {
    try {
      const response = await addressAPI.getAddresses();
      if (response.status === 'success') {
        setAddresses(response.data);

        // Auto-select default address
        const defaultAddress = response.data.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
        } else if (response.data.length > 0) {
          setSelectedAddress(response.data);
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      Alert.alert('Error', 'Failed to load addresses');
    }
  };

  const handleImagePicker = async () => {
    try {
      if (images.length >= 5) {
        Alert.alert('Limit Reached', 'You can upload maximum 5 images');
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll permission is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      console.log('Image picker result:', {
        canceled: result.canceled,
        assets: result.assets ? result.assets.length : 0
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImage = result.assets[0]; // Get the first (and only) image from the array
        setImages(prev => [...prev, newImage]);

        // Upload image immediately
        await uploadSingleImage(newImage);
      }
    } catch (error) {
      console.error('Error picking image:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // Show user-friendly error message
      Alert.alert(
        'Error',
        'Failed to select image. Please try again.'
      );

      // Log ImagePicker availability
      console.log('ImagePicker status:', {
        isAvailable: !!ImagePicker,
        hasMediaTypeOptions: !!ImagePicker.MediaTypeOptions,
        supportedMediaTypes: Object.keys(ImagePicker.MediaTypeOptions || {})
      });
    }
  };

  const uploadSingleImage = async (image) => {
    try {
      setUploadingImages(true);

      console.log('Preparing to upload image:', {
        uri: image.uri,
        type: image.type || 'image/jpeg',
        width: image.width,
        height: image.height
      });

      const response = await uploadAPI.uploadImage(image.uri);
      
      console.log('Upload API response:', {
        success: response.success,
        hasData: !!response.data,
        url: response.data?.url
      });

      if (response.success && response.data && response.data.url) {
        setUploadedImages(prev => [...prev, response.data.url]);
        console.log('Image uploaded successfully:', response.data.url);
      } else {
        console.error('Upload failed, response:', response);
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Upload Error',
        error.userMessage ||
        error.response?.data?.message ||
        'Failed to upload image. Please check your connection and try again.'
      );

      // Remove the failed image from local state
      setImages(prev => prev.filter(img => img.uri !== image.uri));
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = (index) => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setImages(prev => prev.filter((_, i) => i !== index));
            setUploadedImages(prev => prev.filter((_, i) => i !== index));
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!selectedAddress) {
        Alert.alert('Error', 'Please select a pickup address');
        return;
      }

      if (!wasteType) {
        Alert.alert('Error', 'Please select waste type');
        return;
      }

      if (uploadedImages.length === 0) {
        Alert.alert('Error', 'Please add at least one image');
        return;
      }

      // If user selects scheduled, capture date/time now and send with request

      setLoading(true);

      // Create pickup request
      const pickupData = {
        addressId: selectedAddress._id,
        wasteType,
        wasteDetails,
        images: uploadedImages,
        priority,
        scheduledDate: priority === 'scheduled' ? scheduledDate.toISOString() : null,
        scheduledTime: priority === 'scheduled' ? scheduledTime : null,
        estimatedWeight: convertToKg(estimatedWeight) || 0.001,
      };

      console.log('Creating pickup with data:', pickupData);
      const response = await pickupAPI.createPickup(pickupData);

      if (response.status === 'success') {
        Alert.alert(
          'Submitted!',
          'Waiting for admin approval. You will be notified once approved.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('AfterScheduling', {
                  wasteType,
                  bottles: wasteDetails.bottles,
                  otherItems: wasteDetails.otherItems,
                  images: uploadedImages,
                  immediatePickup: priority === 'now',
                  address: selectedAddress,
                  estimatedWeight: parseFloat(estimatedWeight) || 1,
                  pickupId: response.data._id || response.data?.pickup?._id || response.data?.data?._id,
                  priority,
                });
              },
            },
          ]
        );
      } else {
        throw new Error(response.message || 'Failed to create pickup');
      }
    } catch (error) {
      console.error('Error creating pickup request:', error);
      Alert.alert(
        'Error',
        error.userMessage ||
        error.response?.data?.message ||
        'Failed to create pickup request. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const wasteTypes = [
    { id: 'bottles', name: 'Bottles', icon: '🍶', description: 'Plastic bottles, glass bottles' },
    { id: 'mixed', name: 'Mixed Waste', icon: '♻️', description: 'Multiple types of waste' },
    { id: 'other', name: 'Other', icon: '📦', description: 'Other recyclable items' },
  ];

  if (loading && !currentUser) {
    return <Loading fullScreen text="Loading..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Waste</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Address Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Address</Text>

          {addresses.length === 0 ? (
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={() => navigation.navigate('AddressManagement')}
            >
              <Text style={styles.addAddressText}>+ Add Pickup Address</Text>
            </TouchableOpacity>
          ) : (
            <>
              {selectedAddress && (
                <View style={styles.selectedAddress}>
                  <View style={styles.addressInfo}>
                    <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
                    <Text style={styles.addressText}>{selectedAddress.fullAddress}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      // Show address selection modal or navigate to address management
                      Alert.alert(
                        'Select Address',
                        'Choose pickup address:',
                        [
                          ...addresses.map(addr => ({
                            text: `${addr.label} - ${addr.houseFlatBlock}`,
                            onPress: () => setSelectedAddress(addr),
                          })),
                          {
                            text: 'Add New Address',
                            onPress: () => navigation.navigate('AddressManagement'),
                          },
                          { text: 'Cancel', style: 'cancel' },
                        ]
                      );
                    }}
                  >
                    <Text style={styles.changeText}>Change</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

        {/* Waste Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Waste Type</Text>
          <View style={styles.wasteTypes}>
            {wasteTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.wasteTypeCard,
                  wasteType === type.id && styles.selectedWasteType,
                ]}
                onPress={() => setWasteType(type.id)}
              >
                <Text style={styles.wasteTypeIcon}>{type.icon}</Text>
                <Text style={styles.wasteTypeName}>{type.name}</Text>
                <Text style={styles.wasteTypeDesc}>{type.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Waste Details */}
        {wasteType && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Waste Details</Text>

            {(wasteType === 'bottles' || wasteType === 'mixed') && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Number of Bottles</Text>
                <TextInput
                  style={styles.input}
                  value={wasteDetails.bottles.toString()}
                  onChangeText={(text) =>
                    setWasteDetails(prev => ({ ...prev, bottles: parseInt(text) || 0 }))
                  }
                  keyboardType="numeric"
                  placeholder=""
                />
              </View>
            )}

            {(wasteType === 'other' || wasteType === 'mixed') && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Other Items Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={wasteDetails.otherItems}
                  onChangeText={(text) =>
                    setWasteDetails(prev => ({ ...prev, otherItems: text }))
                  }
                  placeholder="Describe other waste items..."
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Estimated Weight (grams)</Text>
              <TextInput
                style={styles.input}
                value={estimatedWeight}
                onChangeText={(text) => {
                  // Only allow numbers and one decimal point
                  const filtered = text.replace(/[^0-9.]/g, '');
                  const parts = filtered.split('.');
                  if (parts.length > 2) return;
                  // Limit to 2 decimal places
                  if (parts[1] && parts[1].length > 2) return;
                  setEstimatedWeight(filtered);
                }}
                keyboardType="decimal-pad"
                placeholder="Enter weight in grams"
                maxLength={6}
              />
            </View>
          </View>
        )}

        {/* Image Upload */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Photos ({images.length}/5)</Text>
            {uploadingImages && <ActivityIndicator size="small" color="#4CAF50" />}
          </View>

          <View style={styles.imageContainer}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: image.uri }} style={styles.uploadedImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => handleRemoveImage(index)}
                >
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            {images.length < 5 && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={handleImagePicker}
                disabled={uploadingImages}
              >
                <Text style={styles.addImageText}>
                  {uploadingImages ? '⏳' : '📷'}
                </Text>
                <Text style={styles.addImageLabel}>
                  {uploadingImages ? 'Uploading...' : 'Add Photo'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.imageHint}>
            Add clear photos of your waste items. This helps our team process your request faster.
          </Text>
        </View>

        {/* Pickup Priority */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Time</Text>
          <View style={styles.priorityOptions}>
            <TouchableOpacity
              style={[
                styles.priorityOption,
                priority === 'now' && styles.selectedPriority,
              ]}
              onPress={() => setPriority('now')}
            >
              <Text style={[
                styles.priorityText,
                priority === 'now' && styles.selectedPriorityText,
              ]}>
                🚀 Pickup Now
              </Text>
              <Text style={styles.priorityDesc}>Get pickup within 2-4 hours</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.priorityOption,
                priority === 'scheduled' && styles.selectedPriority,
              ]}
              onPress={() => setPriority('scheduled')}
            >
              <Text style={[
                styles.priorityText,
                priority === 'scheduled' && styles.selectedPriorityText,
              ]}>
                📅 Schedule Later
              </Text>
              <Text style={styles.priorityDesc}>Choose specific date & time</Text>
            </TouchableOpacity>
          </View>

          {priority === 'scheduled' && (
            <View style={styles.scheduleInputs}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Pickup Date</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.dateText}>
                    {scheduledDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Pickup Time</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowTimePicker(true)}>
                  <Text style={styles.dateText}>
                    {scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {showDatePicker && (
            <DateTimePicker
              value={scheduledDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setScheduledDate(selectedDate);
                }
              }}
              minimumDate={new Date()}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={scheduledTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) {
                  setScheduledTime(selectedTime);
                }
              }}
            />
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading || uploadingImages || !wasteType || uploadedImages.length === 0}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Submit Pickup Request</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backText: {
    fontSize: 16,
    color: '#4CAF50',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },

  // Address styles
  addAddressButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addAddressText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedAddress: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
  },
  changeText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },

  // Waste type styles
  wasteTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  wasteTypeCard: {
    backgroundColor: '#fff',
    width: '48%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  selectedWasteType: {
    borderColor: '#4CAF50',
    backgroundColor: '#f8fff8',
  },
  wasteTypeIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  wasteTypeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  wasteTypeDesc: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },

  // Input styles
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },

  // Image styles
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 10,
    marginBottom: 10,
  },
  uploadedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#f44336',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addImageButton: {
    width: 80,
    height: 80,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  addImageText: {
    fontSize: 24,
    marginBottom: 4,
  },
  addImageLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  imageHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },

  // Priority styles
  priorityOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  priorityOption: {
    backgroundColor: '#fff',
    width: '48%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  selectedPriority: {
    borderColor: '#4CAF50',
    backgroundColor: '#f8fff8',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectedPriorityText: {
    color: '#4CAF50',
  },
  priorityDesc: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },

  // Schedule styles
  scheduleInputs: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  dateButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
  },
  timeSlots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeSlot: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flex: 1,
    marginHorizontal: 2,
  },
  selectedTimeSlot: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  timeSlotText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  selectedTimeSlotText: {
    color: '#fff',
  },

  // Submit button styles
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
