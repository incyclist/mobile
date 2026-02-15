import React, { PropsWithChildren } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors } from '../../theme'

import BleIcon from '../../assets/icons/ble.svg'
import WifiIcon from '../../assets/icons/wifi.svg'

import CadenceIcon from '../../assets/icons/cadence.svg'
import ControllerIcon from '../../assets/icons/controller.svg'
import ResistanceIcon from '../../assets/icons/resistance.svg'
import HeartrateIcon from '../../assets/icons/heartrate.svg'
import PowerIcon from '../../assets/icons/power.svg'
import SpeedIcon from '../../assets/icons/speed.svg'     



import  {CapabilityDisplayProps} from 'incyclist-services'

interface CapabilityTileProps extends CapabilityDisplayProps {
    height: number
    marginRight?: number
    
}

export const CapabilityTile = ( props:PropsWithChildren<CapabilityTileProps>) => {

    const { onClick, ...childProps} = props
   

    const onPress = ()=>{
        if (onClick)
            onClick(props as CapabilityDisplayProps)
    }
    const size = (props.height??0)>150 ? 'large' : 'small'
    const isEmpty = !props.deviceName
    const backgroundColor = isEmpty ?  colors.tileEmpty : colors.tileActive

    return (
        <TouchableOpacity
            style={[styles[size].tile, { height:props.height, backgroundColor,marginRight:props.marginRight}]}
            onPress={onPress}
        >

            <CapabilityTileView {...childProps} size={size} />  
        </TouchableOpacity>
    )
}



type ComponentProps = Partial<CapabilityTileProps> & { 
    size: 'small' | 'large' 
}

const CapabilityTileView = React.memo ( (props: ComponentProps) => {

    const {      
        capability,
        title,
        deviceName,
        connectState,
        value,
        disabled,
        unit,
        interface:ifName,
        size
        
     } = props

    const interfaceMap: Record<string,any> = {
        ble: BleIcon,
        wifi: WifiIcon
    }
    const capabilityMap: Record<string,any> = {
        control: ResistanceIcon,
        power: PowerIcon,
        heartrate: HeartrateIcon,
        cadence: CadenceIcon,
        app_control: ControllerIcon,
        speed: SpeedIcon
    }


    const iconSize = size==='small' ? 12 : 14

    const InterfaceIcon = ifName===undefined ? undefined : interfaceMap[ifName]
    const CapabilityIcon = capability===undefined ? undefined : capabilityMap[capability]


    // --> Pro Chnage Logger
    // const prevProps = React.useRef(null);
    // React.useEffect(() => {
    //     if (prevProps.current) {
    //         const keys = Object.keys({ ...props, ...prevProps.current });
    //         keys.forEach(key => {
    //         if (title==='control'|| title==='resistance' && prevProps.current[key] !== props[key]) {
    //             console.log(`# Pairing: Prop changed: ${key}`, prevProps.current[key], '-->', props[key]);
    //         }
    //         });
    //     }
    //     prevProps.current = props;
    // });    
    // ..... end of logger




    if ( deviceName && !disabled) {
        return (
            <View style= {styles.container}>
            
                { (title ) &&
                    <View style={styles.rows.fixed}>
                        <Text style={styles[size].title}>{title.toUpperCase()}</Text> 
                    </View>
                }

                
                <View  style= {styles.rows.flex} >
                        {CapabilityIcon && 
                            <View style={styles.cols.fixed}>
                                <CapabilityIcon  style={styles[size].icon} width={48} height={48} />   
                            </View>
                        }
                        <View style={styles.cols.fixed}>
                            <Text style={styles[size].value}>                                
                                {value ?  `${value}` : ' ' }
                            </Text>
                            <Text style={styles[size].unit}>                                
                                {unit ?  `${unit}` : ' ' }
                            </Text>
                        </View>

                </View>

                <View style={styles.rows.fixed}>
                        { InterfaceIcon && 
                            <View style={styles.cols.device}>
                                <InterfaceIcon fill="#FFFFFF" width={iconSize} height={iconSize} />
                            </View>
                        }
                        <View style={styles.cols.device}>
                            <Text style={styles[size].device}>{deviceName??' '}</Text>
                        </View>
                </View>

                
                <View style={[styles.rows.fixed, styles[size].footer]}>
                    <Text style={styles[size].state}>
                    {(connectState??' ').toUpperCase()}
                    </Text>
                </View>
                
            </View>
        )
    }
    
    return (
            <View style= {styles.container}>
            {/* {data.header.icon &&
                <Image source={iconMap[data.header.icon]} style={styles.icon} /> } */}
            {title &&
                <View style={styles.rows.fixed}>
                    <Text style={styles[size].title}>{title.toUpperCase()}</Text> 
                </View>
            }


            <View style={[styles.rows.flex]} />

            <View style={ styles.rows.fixed}>
                    <View style={styles.cols.device}>
                        <Text style={styles[size].device}>{' '}</Text>
                    </View>
            </View>

            <View style={[styles.rows.fixed, styles[size].emptyFooter]}>
                    <Text style={styles[size].emptyText}>
                        { disabled ? 'Click to enable' : 'Click to search' }
                    </Text>
            </View>

        </View>        
    )
})


const styles = {
    container: {
        display:'flex',
        flexDirection:'column',
        height: '100%',
        width: '100%',
        flex:1,
        alignItems: 'center',
        justifyContent: 'center',

    },
    rows: StyleSheet.create({
        container: {
            flex:1,
            
        },
        fixed: {
            flexDirection:'row',
            justifyContent: 'center',
        },
        flex: {
            flexDirection:'row',
            flex:1,
            justifyContent: 'center',
            alignItems: 'center',
            width:'100%',
        }
    }),
    idle: { backgroundColor: colors.tileIdle },
    cols: StyleSheet.create({ 
        fixed: {
            display:'flex',
            flexDirection:'column',
            height: '100%',
            flex:1,
            alignItems: 'center',
            justifyContent: 'center',
            
        },
        device: {
            display:'flex',
            flexDirection:'column',
            justifyContent: 'center',

        }

    }),
    small: StyleSheet.create({
        
        tile: {
            aspectRatio:1.25,
            borderRadius: 4,
            alignItems: 'center',
            justifyContent: 'space-between',
            //padding: 8,
        },
        icon: { width: 48, height: 48, color:'#ffffff',tintColor: '#fff' },
        device: { color: '#fff', fontSize: 12 },
        title: { 
            color: '#fff', 
            fontSize: 14,
            fontWeight: '700' 
        },
        value: { 
            color: '#fff', 
            fontSize: 16, fontWeight: '700' },
        unit: { 
            color: '#fff', 
            fontSize: 12, fontWeight: '700' },
        emptyFooter: {
            backgroundColor: colors.tileEmpty,
            justifyContent: 'center',
            padding: 4,
        },

        empty: {
            width: '100%',
            height: '100%',
            textAlign:'center',
            verticalAlign:'middle',
            justifyContent:'center'
        },
        emptyText: { 
            textAlign:'center',
            color: '#fff', fontSize: 10 
        },
        footer: {
            width: '100%',
            backgroundColor: '#000',
            alignItems: 'center',
        },
        state: { 
            color: '#fff', 
            fontSize: 14,
            
        },
    }),
    large: StyleSheet.create({
        tile: {
            aspectRatio:1.25,
            borderRadius: 4,
            alignItems: 'center',
            justifyContent: 'space-between',
            //padding: 8,
        },
        active: { backgroundColor: colors.tileActive },
        idle: { backgroundColor: colors.tileIdle },
        icon: { width: 64, height: 64, color: '#fff' },
        title: { 
            color: '#fff', 
            fontSize: 20,
            fontWeight: '700' ,
            padding:4
        },
        device: { 
            color: '#fff', 
            fontSize: 16,
            padding: 4, 
        },
        value: { 
            color: '#fff', 
            fontSize: 20, 
            fontWeight: '700' ,
        },
        unit: { 
            color: '#fff', 
            fontSize: 14, 
            fontWeight: '700' ,
        },
        empty: {
            width: '100%',
            height: '100%',
            textAlign:'center',
            verticalAlign:'middle',
            justifyContent:'center'
        },
        emptyText: { 
            textAlign:'center',
            color: '#fff', 
            fontSize: 18,
        },
        emptyFooter: {
            backgroundColor: colors.tileEmpty,
            justifyContent: 'center',
            padding: 4,
        },
        footer: {
            
            backgroundColor: '#000',
            justifyContent: 'center',
            padding: 4,
            
            
            
        },
        state: { 
            textAlign: 'center',
            width: '100%',
            color: '#fff', 
            fontSize: 18,
        },
    })



}

