import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Onboarding from '../pages/Onboarding';
import Login from '../pages/Login';


const Stack = createNativeStackNavigator();


export default function AuthStack() {
return (
<Stack.Navigator screenOptions={{ headerShown: false }}>
<Stack.Screen name="Onboarding" component={Onboarding} />
<Stack.Screen name="Login" component={Login} />
</Stack.Navigator>
);
}