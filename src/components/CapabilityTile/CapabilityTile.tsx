import React, { PropsWithChildren } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native'
import { colors } from '../../theme'
import { useLogging } from '../../hooks'

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
    variant?: 'full' | 'short'
    waiting?: boolean
}

export const CapabilityTile = ( props:PropsWithChildren<CapabilityTileProps>) => {

    const { onClick, ...childProps} = props
    const { logEvent } = useLogging('CapabilityTile')

    const onPress = ()=>{
        if (onClick)
            onClick(props as CapabilityDisplayProps)
    }
    // the toggle is on while the capability is used. Switching it off unselects it (normal tile).
    // Switching a switched-off tile's toggle back on (T16) restores its remembered device with no
    // new scan - props.onUse is only set when there is a device to restore.
    const onUseChanged = (use:boolean)=>{
        logEvent({ message:'toggle changed', toggle:'use', capability:props.capability, value:use })
        if (use)
            props.onUse?.()
        else
            props.onUnselect?.()
    }
    const size = (props.height??0)>150 ? 'large' : 'small'
    const hasDevice = Boolean(props.deviceName)
    const switchedOff = hasDevice && Boolean(props.disabled)
    const isEmpty = !hasDevice
    // a switched-off tile (T16) uses the same muted look as an empty tile, not the active colour
    const backgroundColor = hasDevice && !switchedOff ? colors.tileActive : colors.tileEmpty
    const waitingBorder = props.waiting && isEmpty && !props.disabled ? { borderWidth: 3, borderColor: '#f5a623' } : undefined
    const showToggle = hasDevice && Boolean(props.onUnselect || props.onUse)

    return (
        <TouchableOpacity
            style={[styles[size].tile, { height:props.height, backgroundColor,marginRight:props.marginRight}, waitingBorder]}
            onPress={onPress}
        >

            <CapabilityTileView
                {...childProps}
                size={size}
                unselect={showToggle ? <UseSwitch title={props.title} on={!switchedOff} onChange={onUseChanged} /> : undefined}
            />
        </TouchableOpacity>
    )
}

// A small on/off toggle in the footer strip; on while the capability is used
const UseSwitch = ({ title, on, onChange }: { title?: string, on: boolean, onChange: (use:boolean)=>void }) => (
    <View style={unselectStyles.container}>
        <Switch
            value={on}
            onValueChange={onChange}
            trackColor={{ false: colors.switchTrack.false, true: colors.switchTrack.true }}
            thumbColor={on ? colors.switchThumb.on : colors.switchThumb.off}
            accessibilityRole="switch"
            accessibilityLabel={`Use ${title ?? ''}`}
            style={unselectStyles.switch}
        />
    </View>
)

type ComponentProps = Partial<CapabilityTileProps> & {
    size: 'small' | 'large'
    unselect?: React.ReactNode
}

const formatHelpText = (text: string) => text.replace(', e.g. ', ',\ne.g. ').replace('Zwift Play', 'Zwift Play')

// T16b's full-size copy doesn't fit the phone footer; "Not used" (T16) is already short enough as is
const formatEmptyFooter = (text: string, variant: 'full' | 'short') =>
    variant === 'short' && text === 'Not used · tap to search' ? 'Tap to search' : text

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
        size,
        helpText,
        emptyFooter,
        variant = 'full',
        unselect,
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
                    <Text style={[styles[size].state, variant==='short' && compactStateText]} numberOfLines={1}>
                    {(connectState??' ').toUpperCase()}
                    </Text>
                    {unselect}
                </View>

            </View>
        )
    }

    // T16: switched off, but a device is remembered - shown dimmed (muted tile colour, set by the
    // parent), with the device name and no value, and the toggle to turn it straight back on
    if ( deviceName && disabled) {
        return (
            <View style= {styles.container}>

                { title &&
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
                </View>

                <View style={styles.rows.fixed}>
                        <View style={styles.cols.device}>
                            <Text style={styles[size].device}>{deviceName}</Text>
                        </View>
                </View>

                <View style={[styles.rows.fixed, styles[size].footer]}>
                    <Text style={[styles[size].state, variant==='short' && compactStateText]} numberOfLines={1}>
                    {(emptyFooter ?? 'NOT USED').toUpperCase()}
                    </Text>
                    {unselect}
                </View>

            </View>
        )
    }

    return (
            <View style= {styles.container}>
            {title &&
                <View style={styles.rows.fixed}>
                    <Text style={styles[size].title}>{title.toUpperCase()}</Text>
                </View>
            }

            <View style={[styles.rows.flex]}>
                    <Text style={styles[size].helpText}>
                        { formatHelpText((variant === 'short' ? helpText?.short : helpText?.full) ?? ' ') }
                    </Text>
            </View>

            <View style={ styles.rows.fixed}>
                    <View style={styles.cols.device}>
                        <Text style={styles[size].device}>{' '}</Text>
                    </View>
            </View>

            <View style={[styles.rows.fixed, styles[size].emptyFooter]}>
                    <Text style={styles[size].emptyText}>
                        { formatEmptyFooter(emptyFooter ?? ' ', variant) }
                    </Text>
            </View>

        </View>
    )
})

const unselectStyles = StyleSheet.create({
    // a normal flex sibling of the footer's state/emptyFooter text, not an absolute overlay: on
    // a narrow phone tile (the 'small' size), the centred text's width can reach the full width
    // of the footer, so an absolutely positioned toggle on top of it used to overlap the text.
    // Giving the text flex:1 (below) and this a fixed natural width keeps them side by side.
    container: {
        justifyContent: 'center',
        marginLeft: 4,
    },
    switch: {
        transform: [{ scale: 0.7 }],
    },
})

// Phone only ('short' variant) - tablet ('full') keeps its normal state/emptyFooter font size.
// A word like "CONNECTING" needs to fit beside the toggle on a phone's narrow tile; the regular
// size (14, see styles.small.state) doesn't leave room for both. 12 is the floor for phone
// secondary text (ux spec, "never smaller") - numberOfLines={1} on the Text itself is the
// backstop (truncates with an ellipsis) for an even narrower tile or a longer connect state,
// rather than shrinking further.
const compactStateText = StyleSheet.create({
    text: { fontSize: 12 },
}).text

const styles = {
    container: StyleSheet.create({
        main: {
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            width: '100%',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
        }
    }).main,
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
            color: '#fff', fontSize: 12
        },
        helpText: {
            color: '#fff',
            fontSize: 12,
            textAlign: 'center',
            flexShrink: 1,
            paddingHorizontal: 4,
        },
        footer: {
            width: '100%',
            flexDirection: 'row',
            backgroundColor: '#000',
            alignItems: 'center',
        },
        state: {
            flex: 1,
            textAlign: 'center',
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
        helpText: {
            color: '#fff',
            fontSize: 16,
            textAlign: 'center',
            flexShrink: 1,
            paddingHorizontal: 4,
        },
        emptyFooter: {
            backgroundColor: colors.tileEmpty,
            justifyContent: 'center',
            padding: 4,
        },
        footer: {
            flexDirection: 'row',
            backgroundColor: '#000',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 4,
        },
        state: {
            textAlign: 'center',
            flex: 1,
            color: '#fff',
            fontSize: 18,
        },
    })
}