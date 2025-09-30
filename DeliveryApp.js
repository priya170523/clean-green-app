import React from 'react';
import { StatusBar } from 'expo-status-bar';
import DeliveryAppNavigator from './frontend/navigation/DeliveryAppNavigator';

// This is the entry point for the delivery app
export default function DeliveryApp() {
  return (
    <>
      <StatusBar style="dark" />
      <DeliveryAppNavigator />
    </>
  );
}


