import React, { useEffect } from 'react';
import { useIncyclist } from 'incyclist-services';
import { ExitPageView } from './View';
import { getUIBinding } from '../../bindings/ui';

export const ExitPage = () => {

    const incyclist = useIncyclist()

    useEffect( ()=> {
        incyclist.onAppExit()
            .then( ()=>{ getUIBinding().quit()})

    })


    return <ExitPageView/>
    
};


