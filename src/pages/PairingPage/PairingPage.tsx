import React, { useCallback, useEffect, useRef, useState } from 'react'


import { getDevicesPageService,PairingDisplayProps, IObserver } from 'incyclist-services'
import { MainBackground } from '../../components'
import { useLogging,useUnmountEffect } from '../../hooks'
import { PairingPageView } from './View'
import { Platform } from 'react-native'


const initialProps:PairingDisplayProps = { 
    title: undefined, 
    capabilities: {top: [],bottom:[]},
    interfaces: [],
    buttons:[]
    
}

export const PairingPage = () => {
    const [props, setProps] = useState<PairingDisplayProps>(initialProps)
    const refObserver = useRef<IObserver|null|undefined>(null)

    const service = getDevicesPageService()
    const {logError,logEvent} = useLogging('PairingPage')

    

    const onUpdate = useCallback(() => {
        
        const updated = service.getPageDisplayProperties()
        if (updated) {
            //console.log('# update', updated)
            setProps(updated)
            
        }
    },[service])


    useEffect(() => {
        if (!service || refObserver.current)
            return

        let observer
        try {

            refObserver.current = observer = service?.openPage()
            observer.on('page-update', onUpdate)

            onUpdate()
        }
        catch(err:any) {
            logError(err,'init effect')
        }


    }, [service, logError, logEvent, onUpdate])

    useUnmountEffect( ()=> {
        service.closePage()        
    })

    if (!refObserver.current) {
        return <MainBackground />
    }


    const showExit = Platform.OS==='android'
    return <PairingPageView {...props} showExit={showExit} />

}

