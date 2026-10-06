import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import type { PairingDisplayProps, InterfaceDisplayProps } from 'incyclist-services'

import { colors, textSizes } from '../../theme'
import { ButtonBar, CapabilityGrid, MainBackground, InterfaceState, DeviceSelector } from '../../components'
import { BleInterfaceSettings } from '../../components/BleInterfaceSettings'
import { useScreenLayout } from '../../hooks'
import ExitIcon from '../../assets/icons/exit.svg'

export const PairingPageView = (props: PairingDisplayProps) => {
    const { deviceSelection, onExit } = props
    const compact = useScreenLayout() === 'compact'

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
                            onClick={() => {
                                inter.onClick()
                            }}
                        />
                    ))}
                </View>

                <View style={styles.rowTitle}>
                    <Text style={styles.title}>{props.title?.toUpperCase()}</Text>
                </View>

                {props.status && (
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: statusDotColors[props.status.dot] }]} />
                        <Text style={styles.statusText}>{compact ? props.status.shortText : props.status.text}</Text>
                    </View>
                )}

                <View style={styles.rowFlex}>
                    {/* <InterfaceInfo interfaces={props.interfaces} /> */}

                    <CapabilityGrid capabilities={props.capabilities} compact={compact} readyToStart={props.readyToStart} noSearch={props.status?.id === 'S1'} />
                </View>

                <View style={styles.rowButtons}>
                    {props.buttons && <ButtonBar buttons={props.buttons} />}
                </View>

                {props.showExit && (
                    <TouchableOpacity style={styles.exit} onPress={onExit}>
                        <ExitIcon fill="#FFFFFF" width={48} height={48} />
                    </TouchableOpacity>
                )}

                {props.showInterfaceSettings === 'ble' && Platform.OS !== 'web' && <BleInterfaceSettings />}
            </MainBackground>
        </View>
    )
}

const statusDotColors = {
    red: '#e74c3c',
    green: '#2ecc71',
    amber: '#f5a623',
}

const styles = StyleSheet.create({
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        color: '#fff',
        fontSize: 13,
    },
    container: {
        flex: 1,
        flexDirection: 'row',
    },
    rowTitle: {
        marginVertical: 5,
    },
    rowButtons: {},
    interfaceOverlay: {
        position: 'absolute',
        top: 20,
        right: 20,
        flexDirection: 'row', // Icons will sit side-by-side
        zIndex: 999, // Ensures it floats above MainBackground children
        alignItems: 'flex-start',
    },
    rowFlex: {
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
        zIndex: 999, // Ensures it floats above MainBackground children
    },
})