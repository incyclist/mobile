import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainPage } from '../Main';
import { PairingPage } from '../PairingPage';
import { navigationRef } from '../../services';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
    return (
        <NavigationContainer ref={navigationRef}>
            <Stack.Navigator initialRouteName="devices"                 
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: 'black' } // Optional: ensure full-screen look
                }}>
                <Stack.Screen name="main" component={MainPage} />
                <Stack.Screen name="user" component={MainPage} />
                <Stack.Screen name="settings" component={MainPage} />
                <Stack.Screen name="search" component={MainPage} />
                <Stack.Screen name="routes" component={MainPage} />
                <Stack.Screen name="workouts" component={MainPage} />
                <Stack.Screen name="activities" component={MainPage} />
                <Stack.Screen name="rideDeviceOK" component={MainPage} />
                <Stack.Screen name="devices" component={PairingPage} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};
