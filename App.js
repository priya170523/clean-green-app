import React from 'react';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import UserAppNavigator from './frontend/navigation/UserAppNavigator';
import DeliveryAppNavigator from './frontend/navigation/DeliveryAppNavigator';

export default function App() {
  const appTarget = (Constants?.expoConfig?.extra?.appTarget) || 'user';
  return (
    <>
      <StatusBar style="dark" />
      {appTarget === 'delivery' ? <DeliveryAppNavigator /> : <UserAppNavigator />}
    </>
  );
}
