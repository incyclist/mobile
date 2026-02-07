import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'

import { colors } from '../../theme'

import { useDevicePairing,PairingDisplayProps, useIncyclist, DevicePairingService, UserInterfaceServcie, IObserver } from 'incyclist-services'
import { ButtonBar, CapabilityGrid, ExitButton, MainBackground } from '../../components'
import { useLogging } from '../../hooks'

const { height } = Dimensions.get('window')
const compact = height < 420

const initialProps:PairingDisplayProps = { 
    title: undefined, 
    capabilties: {top: [],bottom:[]},
    interfaces: [],
    buttons:{primary:'ok',showOK:false, showExit:true, showSimulate:false, showSkip:false}
}

export const PairingPage = () => {
    const [props, setProps] = useState<PairingDisplayProps>(initialProps)
    const refObserver = useRef<IObserver|null|undefined>(null)

    const service = useDevicePairing()
    const incyclist = useIncyclist()

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
                console.log('# got update', JSON.stringify(updated))
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

    const onExit = ()=>{
        incyclist.onAppExit()
    }

  return (
    <MainBackground>
        <View style={styles.container}>
        <Text style={styles.title}>{props.title}</Text>

        {/* <InterfaceInfo interfaces={props.interfaces} /> */}

        <CapabilityGrid capabilities={props.capabilties} compact={compact} />

        <ButtonBar {...props.buttons} />

        <ExitButton onExit={onExit}/>

        </View>
    </MainBackground>
  )

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  title: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginVertical: 0,
    
  },
})
