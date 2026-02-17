import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native'
import type { PairingDisplayProps,InterfaceDisplayProps  } from 'incyclist-services'

import { colors,textSizes } from '../../theme'
import { ButtonBar, CapabilityGrid,  MainBackground,InterfaceState,DeviceSelector } from '../../components'
import { BleInterfaceSettings } from '../../components/BleInterfaceSettings'
import ExitIcon from '../../assets/icons/exit.svg'     


const { height } = Dimensions.get('window')
const compact = height < 420


export const PairingPageView = (props:PairingDisplayProps)=> {
    const {deviceSelection,onExit} = props

    return (
        <View style={styles.container}>
            <MainBackground>
                {deviceSelection && <DeviceSelector {...deviceSelection} />}

                <View style={styles.interfaceOverlay}>
                {props.interfaces?.map((inter: InterfaceDisplayProps, index: number) => (
                    <InterfaceState 
                    key={`${inter.name}-${index}`}
                    name={inter.name}
                    state={inter.state}
                    error={inter.error}
                    onClick={()=> {inter.onClick()}}
                    />
                ))}
                </View>            

                <View style={styles.rowTitle}>
                    <Text style={styles.title}>{props.title?.toUpperCase()}</Text>
                </View>

                <View style={styles.rowFlex}>
                    {/* <InterfaceInfo interfaces={props.interfaces} /> */}

                    <CapabilityGrid capabilities={props.capabilities} compact={compact} />
                </View>

                <View style={styles.rowButtons}>
                    {props.buttons && <ButtonBar buttons={props.buttons} />}
                </View>
                
                {props.showExit &&   <TouchableOpacity style={styles.exit} onPress={onExit}>
                    <ExitIcon fill="#FFFFFF" width={48} height={48}/>
                  </TouchableOpacity>
                }

                {props.showInterfaceSettings==='ble' && Platform.OS!=='web' && <BleInterfaceSettings/>}

            </MainBackground>
        </View>
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
    },
        rowTitle:{
        marginVertical: 5,
    },
    rowButtons:{

    },
    interfaceOverlay: {
        position: 'absolute',
        top: 20,
        right: 20,
        flexDirection: 'row', // Icons will sit side-by-side
        zIndex: 999,          // Ensures it floats above MainBackground children
        alignItems: 'flex-start',
    },  
    rowFlex:{
        flex: 1, // Takes up all available space
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        textAlign: 'center',
        fontSize: textSizes.pageTitle,
        fontWeight: '700',
        color: colors.textPrimary,
        marginVertical: 0,
    },
    exit: {
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 999,          // Ensures it floats above MainBackground children
    },
})
