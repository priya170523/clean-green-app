import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import UserLogin from '../pages/UserLogin';
import UserSignup from '../pages/UserSignup';
import TabNavigator from './TabNavigator';
import WasteUploadNew from '../pages/WasteUploadNew';
import AfterScheduling from '../pages/AfterScheduling';
import MapView from '../pages/MapView';
import PickupScheduler from '../pages/PickupScheduler';
import AddressManagement from '../pages/AddressManagement';
import Support from '../pages/Support';

const Stack = createNativeStackNavigator();

export default function UserAppNavigator() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen 
            name="Auth" 
            component={UserLogin}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="UserSignup">
            {(props) => <UserSignup {...props} forcedRole="user" />}
          </Stack.Screen>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="WasteUploadNew" component={WasteUploadNew} />
          <Stack.Screen name="AfterScheduling" component={AfterScheduling} />
          <Stack.Screen name="MapView" component={MapView} />
          <Stack.Screen name="PickupScheduler" component={PickupScheduler} />
          <Stack.Screen name="AddressManagement" component={AddressManagement} />
          <Stack.Screen name="Support" component={Support} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}


