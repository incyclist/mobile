import React from 'react';
import {  NavigationBar, MainBackground ,FreeMap} from '../../components';


import type { TNavigationItem } from '../../components';
import { View } from 'react-native';


export const MainPageView = ( {onClick}: {onClick:( item:TNavigationItem)=>void}) => {
const mockPoints = [
    { lat: 52.5200, lng: 13.4050, routeDistance: 0 },
    { lat: 52.5210, lng: 13.4100, routeDistance: 500 },
    { lat: 52.5220, lng: 13.4150, routeDistance: 1000 },
];

    return (
        <MainBackground>
            <View style={{display:'flex', flexDirection:'row', justifyContent:'flex-start'}}>
                <View style={{ width:150 }}>
                    <NavigationBar position='left' onClick={onClick}/>
                </View>
                <View style={{flex:1 }}>
                    <FreeMap points={mockPoints} position={mockPoints[0]} zoom={14} />
                </View>
            </View>
        </MainBackground>
    );
};