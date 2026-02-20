import React from 'react';
import {  NavigationBar, MainBackground ,FreeMap} from '../../components';
import type { TNavigationItem } from '../../components';
import { View } from 'react-native';
import { RoutesTable } from '../../components/RoutesTable';

import type {RoutePageDisplayProps} from 'incyclist-services'

type TRoutesPageDisplayProps = RoutePageDisplayProps & {
    onClick: ( item:TNavigationItem)=>void
}


export const RoutesPageView = ( props: TRoutesPageDisplayProps) => {

    const { onClick,routes } = props

    const onSelect =( id) => {

    }
    const onDelete =( id) => {
        
    }

    return (
        <MainBackground>
            <View style={{display:'flex', flexDirection:'row', justifyContent:'flex-start'}}>
                <View>
                    <NavigationBar position='left' onClick={onClick}/>
                </View>
                <View style={{flex:1 }}>
                    <RoutesTable routes={routes??[]} onSelect={onSelect} onDelete={onDelete} />
                    
                </View>
            </View>
        </MainBackground>
    );
};