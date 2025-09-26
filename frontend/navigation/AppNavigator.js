import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, Text } from 'react-native';
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
import ScheduledPage from '../pages/ScheduledPage';
import DeliveryPickupAccepted from '../pages/DeliveryPickupAccepted';
import AddressManagement from '../pages/AddressManagement';
import Support from '../pages/Support';
import WarehouseNavigation from '../pages/WarehouseNavigation';
import UserTrackingMap from '../components/UserTrackingMap';
import EarningsPage from '../pages/EarningsPage';
import SchedulePickupPage from '../pages/SchedulePickupPage';
import DeliveryRoutePage from '../pages/DeliveryRoutePage';

const Stack = createNativeStackNavigator();

const BackButton = ({ navigation }) => (
  <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 10 }}>
    <Text style={{ color: '#fff', fontSize: 16 }}>Back</Text>
  </TouchableOpacity>
);

export default function AppNavigator() {
  return (
    <Stack.Navigator 
      screenOptions={{
        headerShown: true,
        headerLeft: ({ navigation }) => <BackButton navigation={navigation} />,
        headerStyle: { backgroundColor: '#4CAF50' },
        headerTintColor: '#fff',
      }}
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
      <Stack.Screen name="WasteUploadNew" component={WasteUploadNew} />
      <Stack.Screen name="AfterScheduling" component={AfterScheduling} />
      <Stack.Screen name="MapView" component={MapView} />
      <Stack.Screen name="PickupScheduler" component={PickupScheduler} />
      <Stack.Screen name="ScheduledPage" component={ScheduledPage} />
      <Stack.Screen name="DeliveryPickupAccepted" component={DeliveryPickupAccepted} />
      <Stack.Screen name="AddressManagement" component={AddressManagement} />
      <Stack.Screen name="Support" component={Support} />
      <Stack.Screen name="WarehouseNavigation" component={WarehouseNavigation} />
      <Stack.Screen name="UserTrackingMap" component={UserTrackingMap} />
      <Stack.Screen name="EarningsPage" component={EarningsPage} />
      <Stack.Screen name="SchedulePickupPage" component={SchedulePickupPage} />
      <Stack.Screen 
        name="DeliveryRoutePage" 
        component={DeliveryRoutePage} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
