import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ExitPage } from '../ExitPage';
import { PairingPage } from '../PairingPage';
import { navigationRef } from '../../services';
import { RoutesPage } from '../RoutesPage/RoutesPage';
import { RidePage } from '../RidePage'; // New import
import { VideoDemoPage } from '../VideoDemo/RidePage';
import { NotImplementedPage } from '../NotImplemented/NotImplementedPage';

const Stack = createNativeStackNavigator();

const WorkoutsPage = ()=> <NotImplementedPage selected='workouts'/>
const ActivitiesPage = ()=> <NotImplementedPage selected='activities'/>

export const RootNavigator = () => {
    return (
        <NavigationContainer ref={navigationRef}>
            <Stack.Navigator initialRouteName="devices"                 
                screenOptions={{
                    headerShown: false,
                    //contentStyle: { backgroundColor: 'black' } // Optional: ensure full-screen look
                }}>
                <Stack.Screen name="main" component={NotImplementedPage} />
                <Stack.Screen name="user" component={NotImplementedPage} />
                <Stack.Screen name="search" component={RoutesPage} />
                <Stack.Screen name="routes" component={RoutesPage} />
                <Stack.Screen name="activities" component={ActivitiesPage} />
                <Stack.Screen name="workouts" component={WorkoutsPage} />


                <Stack.Screen name="devices" component={PairingPage} />
                <Stack.Screen name="pairing" component={PairingPage} />
                <Stack.Screen name="pairingStart">
                    { ()=> <PairingPage forRide/>} 
                </Stack.Screen>
                
                <Stack.Screen name="exit" component={ExitPage} />
                <Stack.Screen name="videoDemo" component={VideoDemoPage} /> 
                
                <Stack.Screen name='rideDeviceOK'>
                    {() => <RidePage />}
                </Stack.Screen>
                <Stack.Screen name='rideSimulate'>
                    {() => <RidePage simulate={true} />}
                </Stack.Screen>
            </Stack.Navigator>
        </NavigationContainer>
    );
};