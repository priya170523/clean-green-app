import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import DeliveryLogin from '../pages/DeliveryLogin';
import DeliveryTabNavigator from './DeliveryTabNavigator';
import DeliveryRoutePage from '../pages/DeliveryRoutePage';
import Support from '../pages/Support';
import DeliverySignup from '../pages/DeliverySignup';
import WarehouseNavigation from '../pages/WarehouseNavigation';

const Stack = createNativeStackNavigator();

export default function DeliveryAppNavigator() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen 
            name="Auth" 
            component={DeliveryLogin}
            options={{ headerShown: true, title: 'DeliveryLogin' }}
          />
          <Stack.Screen name="DeliveryMain" component={DeliveryTabNavigator} />
          <Stack.Screen name="DeliveryRoutePage" component={DeliveryRoutePage} />
          <Stack.Screen name="Support" component={Support} />
          <Stack.Screen name="WarehouseNavigation" component={WarehouseNavigation} />
          <Stack.Screen name="DeliverySignup" component={DeliverySignup} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}


