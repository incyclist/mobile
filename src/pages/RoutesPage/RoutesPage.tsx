import React from 'react';
import { useIncyclist } from 'incyclist-services';
import type { TNavigationItem } from '../../components';
import { navigate } from '../../services';
import { RoutesPageView } from './View';
import { getUIBinding } from '../../bindings/ui';

export const RoutesPage = () => {

    const incyclist = useIncyclist()
    

    const onClick=( item:TNavigationItem)=> {
        if (item==='exit') {
            incyclist.onAppExit()
                .then( ()=>{ getUIBinding().quit()})
        }
        else 
            navigate(item)
    }

    return <RoutesPageView onClick={onClick}/>
    
};


