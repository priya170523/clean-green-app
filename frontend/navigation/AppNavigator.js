import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../../theme/colors';

// Import screens
import UserProfileSelector from '../pages/UserProfileSelector';
import Login from '../pages/Login';
import UserSignup from '../pages/UserSignup';
import DeliveryLogin from '../pages/DeliveryLogin';
import DeliverySignup from '../pages/DeliverySignup';
import TabNavigator from './TabNavigator';
import DeliveryTabNavigator from './DeliveryTabNavigator';
import WasteUploadNew from '../pages/WasteUploadNew';
import AfterScheduling from '../pages/AfterScheduling';
import MapView from '../pages/MapView';
import PickupScheduler from '../pages/PickupScheduler';
import DeliveryPickupAccepted from '../pages/DeliveryPickupAccepted';
import AddressManagement from '../pages/AddressManagement';
import Support from '../pages/Support';
import WarehouseNavigation from '../pages/WarehouseNavigation';
import UserTrackingMap from '../components/UserTrackingMap';
import EarningsPage from '../pages/EarningsPage';
import SchedulePickupPage from '../pages/SchedulePickupPage';
import DeliveryRoutePage from '../pages/DeliveryRoutePage';

const Stack = createNativeStackNavigator();

// Component styles
const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.primary,
    height: Platform.OS === 'ios' ? 96 : 64,
    elevation: 0,
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  backButton: {
    padding: 8,
    marginLeft: 8,
    marginTop: Platform.OS === 'ios' ? 8 : 0,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 24,
    lineHeight: 24,
  },
});

// Back button component with navigation check
const BackButton = ({ navigation }) => {
  if (!navigation?.canGoBack()) return null;
  
  return (
    <TouchableOpacity 
      onPress={() => navigation.goBack()} 
      style={styles.backButton}
      accessibilityLabel="Go back"
      accessibilityRole="button"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={styles.backButtonText}>←</Text>
    </TouchableOpacity>
  );
};

// Default screen options
const defaultScreenOptions = {
  headerStyle: styles.header,
  headerTitleStyle: styles.headerTitle,
  headerTitleAlign: 'center',
  headerTintColor: COLORS.white,
  headerBackVisible: false,
  headerShadowVisible: false,
};

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        ...defaultScreenOptions,
        headerLeft: () => <BackButton navigation={navigation} />,
        animation: 'slide_from_right',
      })}
    >
      <Stack.Screen 
        name="UserProfileSelector" 
        component={UserProfileSelector} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="UserAuth" 
        component={Login} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="UserSignup" 
        component={UserSignup} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="DeliveryAuth" 
        component={DeliveryLogin} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="DeliverySignup" 
        component={DeliverySignup} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Main" 
        component={TabNavigator} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="DeliveryMain" 
        component={DeliveryTabNavigator} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="WasteUploadNew" 
        component={WasteUploadNew} 
        options={{ title: 'Upload Waste' }}
      />
      <Stack.Screen 
        name="AfterScheduling" 
        component={AfterScheduling} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="MapView" 
        component={MapView} 
        options={{ title: 'Location' }}
      />
      <Stack.Screen 
        name="PickupScheduler" 
        component={PickupScheduler} 
        options={{ title: 'Schedule Pickup' }}
      />
      <Stack.Screen 
        name="DeliveryPickupAccepted" 
        component={DeliveryPickupAccepted} 
        options={{ title: 'Pickup Details' }}
      />
      <Stack.Screen 
        name="AddressManagement" 
        component={AddressManagement} 
        options={{ title: 'Manage Addresses' }}
      />
      <Stack.Screen 
        name="Support" 
        component={Support} 
        options={{ title: 'Support' }}
      />
      <Stack.Screen 
        name="WarehouseNavigation" 
        component={WarehouseNavigation} 
        options={{ title: 'Warehouse Location' }}
      />
      <Stack.Screen 
        name="UserTrackingMap" 
        component={UserTrackingMap} 
        options={{ title: 'Track Pickup' }}
      />
      <Stack.Screen 
        name="EarningsPage" 
        component={EarningsPage} 
        options={{ title: 'Earnings' }}
      />
      <Stack.Screen 
        name="SchedulePickupPage" 
        component={SchedulePickupPage} 
        options={{ title: 'Schedule Pickup' }}
      />
      <Stack.Screen 
        name="DeliveryRoutePage" 
        component={DeliveryRoutePage} 
        options={{ title: 'Delivery Route' }}
      />
    </Stack.Navigator>
  );
}