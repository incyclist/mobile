import React, { PropsWithChildren } from 'react'
import { View, Text, TouchableOpacity, Pressable, StyleSheet, Switch, Platform } from 'react-native'
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
import { isConnected, isSwitchedOff } from '../CapabilityStatusBars/utils'

interface CapabilityTileProps extends CapabilityDisplayProps {
    height: number
    marginRight?: number
    variant?: 'full' | 'short'
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
    const switchedOff = isSwitchedOff(props)
    // only a connected device gets the in-use colour - the same rule as the status bars, so the grid
    // and the bars always agree. A device that is still connecting or can't be reached, and a
    // switched-off tile (T16), use the same muted look as an empty tile.
    const backgroundColor = isConnected(props) ? colors.tileActive : colors.tileEmpty
    // the page service decides which tiles the page waits for; the tile only renders the outline
    const waitingBorder = props.awaited ? { borderWidth: 3, borderColor: colors.pairingWaiting } : undefined
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

// A small on/off toggle in the footer strip; on while the capability is used.
// The switch is drawn scaled down, so the Pressable around it owns the tap, with a hitSlop that
// brings the touch area back up to the platform minimum. The switch itself takes no touches
// (pointerEvents="none" on its wrapper), so a tap is handled once, here.
const UseSwitch = ({ title, on, onChange }: { title?: string, on: boolean, onChange: (use:boolean)=>void }) => (
    <Pressable
        style={unselectStyles.container}
        hitSlop={SWITCH_HIT_SLOP}
        onPress={() => onChange(!on)}
        accessibilityRole="switch"
        accessibilityLabel={`Use ${title ?? ''}`}
        accessibilityState={{ checked: on }}
    >
        <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Switch
                value={on}
                trackColor={{ false: colors.switchTrack.false, true: colors.switchTrack.true }}
                thumbColor={on ? colors.switchThumb.on : colors.switchThumb.off}
                style={unselectStyles.switch}
            />
        </View>
    </Pressable>
)

type ComponentProps = Partial<CapabilityTileProps> & {
    size: 'small' | 'large'
    unselect?: React.ReactNode
}

const formatHelpText = (text: string) => text.replace(', e.g. ', ',\ne.g. ').replace('Zwift Play', 'Zwift Play')

// the page service's footer copy, when it has one for this tile: the phone copy on a phone, the full one on a tablet
const pickFooterText = (footerText: CapabilityDisplayProps['footerText'], variant: 'full' | 'short'): string | undefined => {
    if (!footerText)
        return undefined
    return variant === 'short' ? footerText.short : footerText.full
}

// the footer of a tile with an active device: the page service's copy if set, otherwise the state
// text ('Found', shown amber while a search runs) or the connect state
const getActiveFooter = (footer: string | undefined, stateText?: string, connectState?: string): { text: string, searching: boolean } => {
    if (footer)
        return { text: footer, searching: false }
    return { text: (stateText ?? connectState ?? ' ').toUpperCase(), searching: Boolean(stateText) }
}

type DeviceWithRoleProps = {
    size: 'small' | 'large'
    roleLabel?: string
    trainerRole?: CapabilityDisplayProps['trainerRole']
    children: React.ReactNode
}

// The device row, with the line that says how the tile relates to the trainer: above the device name
// on the trainer's own tile ("Your trainer"), below it on a tile the trainer fills ("via your trainer")
const DeviceWithRole = ({ size, roleLabel, trainerRole, children }: DeviceWithRoleProps) => {
    const label = roleLabel ? (
        <View style={styles.rows.fixed}>
            <Text style={styles[size].roleLabel} numberOfLines={1}>{roleLabel}</Text>
        </View>
    ) : null
    const labelFirst = trainerRole === 'trainer'

    return (
        <>
            {labelFirst && label}
            {children}
            {!labelFirst && label}
        </>
    )
}

const CapabilityTileView = React.memo ( (props: ComponentProps) => {

    const {
        capability,
        title,
        deviceName,
        connectState,
        stateText,
        value,
        disabled,
        unit,
        interface:ifName,
        size,
        helpText,
        emptyFooter,
        footerText,
        roleLabel,
        trainerRole,
        variant = 'full',
        unselect,
     } = props
    const footer = pickFooterText(footerText, variant)
    const footerFit = variant === 'full' ? tabletFooterFit : undefined

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
        const activeFooter = getActiveFooter(footer, stateText, connectState)
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

                <DeviceWithRole size={size} roleLabel={roleLabel} trainerRole={trainerRole}>
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
                </DeviceWithRole>

                <View style={[styles.rows.fixed, styles[size].footer]}>
                    <Text style={[styles[size].state, variant==='short' && compactStateText, activeFooter.searching && searchingStateText]} numberOfLines={1} {...footerFit}>
                    {activeFooter.text}
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

                <DeviceWithRole size={size} roleLabel={roleLabel} trainerRole={trainerRole}>
                    <View style={styles.rows.fixed}>
                            <View style={styles.cols.device}>
                                <Text style={styles[size].device}>{deviceName}</Text>
                            </View>
                    </View>
                </DeviceWithRole>

                <View style={[styles.rows.fixed, styles[size].footer]}>
                    <Text style={[styles[size].state, variant==='short' && compactStateText]} numberOfLines={1} {...footerFit}>
                    {footer ?? (emptyFooter ?? 'NOT USED').toUpperCase()}
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
                    <Text style={styles[size].emptyText} {...footerFit}>
                        { footer ?? emptyFooter ?? ' ' }
                    </Text>
            </View>

        </View>
    )
})

// The switch is drawn at SWITCH_SCALE, but a transform doesn't change layout, so its container is
// sized to the scaled footprint - otherwise it reserves the unscaled box and takes that width away
// from the footer text. Native sizes, unscaled:
// - Android: SwitchCompat with the AppCompat track/thumb drawables measures 38x27dp
// - iOS: RN reports UISwitch's intrinsic size + 2pt width - 53x31 for the classic switch, 65x28
//   for the wider iOS 26 one; the container takes the wider of the two widths and the taller height
const SWITCH_SCALE = 0.7
const SWITCH_NATIVE_SIZE = Platform.select({
    android: { width: 38, height: 27 },
    default: { width: 65, height: 31 },
})
const SWITCH_FOOTPRINT = {
    width: Math.ceil(SWITCH_NATIVE_SIZE.width * SWITCH_SCALE),
    height: Math.ceil(SWITCH_NATIVE_SIZE.height * SWITCH_SCALE),
}
// minimum touch target: 48dp on Android, 44pt on iOS
const MIN_TOUCH_SIZE = Platform.OS === 'android' ? 48 : 44
const slopFor = (size: number) => Math.max(0, Math.ceil((MIN_TOUCH_SIZE - size) / 2))
const SWITCH_HIT_SLOP = {
    top: slopFor(SWITCH_FOOTPRINT.height),
    bottom: slopFor(SWITCH_FOOTPRINT.height),
    left: slopFor(SWITCH_FOOTPRINT.width),
    right: slopFor(SWITCH_FOOTPRINT.width),
}

const unselectStyles = StyleSheet.create({
    // a normal flex sibling of the footer's state/emptyFooter text, not an absolute overlay: on
    // a narrow phone tile (the 'small' size), the centred text's width can reach the full width
    // of the footer, so an absolutely positioned toggle on top of it used to overlap the text.
    // Giving the text flex:1 (below) and this a fixed width keeps them side by side.
    container: {
        ...SWITCH_FOOTPRINT,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 4,
    },
    switch: {
        transform: [{ scale: SWITCH_SCALE }],
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

// Tablet only ('full' variant): the footer strip is the narrowest text on the tile, so a footer
// that is slightly too long (a smaller tablet, a larger OS font scale) shrinks to fit one line
// rather than wrapping; numberOfLines={1} still ellipsizes anything that doesn't fit even then.
// On Android, RN ignores minimumFontScale - the text still shrinks only as much as needed to fit
// one line, but down to RN's own 4pt minimum instead of the 75% floor. The phone keeps its fixed floor size (see compactStateText).
const tabletFooterFit = {
    numberOfLines: 1,
    adjustsFontSizeToFit: true,
    minimumFontScale: 0.75,
} as const

// stateText ('Found') shows while a search is still running - use the same amber used elsewhere
// on this screen for an in-progress/searching state (see waitingBorder above), distinct from the
// plain white connect-state text so it doesn't read as already connected.
const searchingStateText = StyleSheet.create({
    text: { color: '#f5a623' },
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
        roleLabel: { color: '#fff', fontSize: 12, fontStyle: 'italic' },
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
        roleLabel: {
            color: '#fff',
            fontSize: 16,
            fontStyle: 'italic',
            paddingHorizontal: 4,
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