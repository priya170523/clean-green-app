import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserProfileSelector" component={UserProfileSelector} />
      <Stack.Screen name="UserAuth" component={Login} />
      <Stack.Screen name="UserSignup" component={UserSignup} />
      <Stack.Screen name="DeliveryAuth" component={DeliveryLogin} />
      <Stack.Screen name="DeliverySignup" component={DeliverySignup} />
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="DeliveryMain" component={DeliveryTabNavigator} />
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
      <Stack.Screen name="DeliveryRoutePage" component={DeliveryRoutePage} />
    </Stack.Navigator>
  );
}
