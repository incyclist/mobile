import React, { useCallback, useEffect, useRef, useState } from 'react'
import {Dimensions } from 'react-native'


import { useDevicePairing,PairingDisplayProps, IObserver } from 'incyclist-services'
import { MainBackground } from '../../components'
import { useLogging } from '../../hooks'
import { PairingPageView } from './View'

const { height } = Dimensions.get('window')
const compact = height < 420

const initialProps:PairingDisplayProps = { 
    title: undefined, 
    capabilities: {top: [],bottom:[]},
    interfaces: [],
    buttons:[]
    
}

export const PairingPage = () => {
    const [props, setProps] = useState<PairingDisplayProps>(initialProps)
    const refObserver = useRef<IObserver|null|undefined>(null)

    const service = useDevicePairing()

    const {logError,logEvent} = useLogging('Pairing')


    useEffect(() => {
        if (!service || refObserver.current)
            return

        logEvent({message:'opening pairing page'})

        let observer
        try {
            refObserver.current = observer = service?.openPage()

            const update = () => {
                
                const updated = service.getPageDisplayProperties()
                if (updated) {
                    setProps(updated)
                    
                }
            }

            observer.on('page-update', update)

            update()


        }
        catch(err:any) {
            logError(err,'init effect')
        }


    }, [service, logError, logEvent])

    if (!refObserver.current) {
        return <MainBackground />
    }


  return <PairingPageView {...props}/>

}

