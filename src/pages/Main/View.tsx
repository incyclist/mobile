import React from 'react';
import {  NavigationBar, MainBackground } from '../../components';


import type { TNavigationItem } from '../../components';

export const MainPageView = ( {onClick}: {onClick:( item:TNavigationItem)=>void}) => {


    return (
        <MainBackground>
            <NavigationBar position='left' onClick={onClick}/>
            {/* Future content like Buttons or Text will go here */}
        </MainBackground>
    );
};