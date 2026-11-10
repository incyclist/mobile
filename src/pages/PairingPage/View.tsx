import React, { useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native'
import type { PairingDisplayProps, InterfaceDisplayProps } from 'incyclist-services'

import { colors, textSizes } from '../../theme'
import {
    ButtonBar, CapabilityGrid, CapabilityStatusBars, MainBackground, InterfaceState, DeviceSelector,
    PairingConflictDialog, PairingHelperPanel, PairingStatusLine,
} from '../../components'
import { BleInterfaceSettings } from '../../components/BleInterfaceSettings'
import { useScreenLayout } from '../../hooks'
import ExitIcon from '../../assets/icons/exit.svg'
import { getStatusLinkHandler } from './utils'

// the helper panel's width beside the tiles
const PANEL_WIDTH_PHONE = 300
const PANEL_WIDTH_TABLET = 320
// the interface icons float at the top right (top 20, 80 high, see InterfaceState). The panel starts
// below them, so they never cover its close button.
const PANEL_TOP_CLEARANCE = 56

export const PairingPageView = (props: PairingDisplayProps) => {
    const { deviceSelection, onExit, helper, status, interfaces, capabilities, pendingConflict } = props
    const compact = useScreenLayout() === 'compact'
    const panelLayout = compact ? 'phone' : 'tablet'

    const onStatusLink = useMemo(() => getStatusLinkHandler(status, helper, interfaces), [status, helper, interfaces])

    const helperOpen = helper !== undefined && helper.phase !== 'hidden'
    // on a phone, the helper's panel leaves too little room for tiles: the required row becomes status bars
    const showBars = helperOpen && compact
    const panelStyle = { width: compact ? PANEL_WIDTH_PHONE : PANEL_WIDTH_TABLET }

    return (
        <View style={styles.container}>
            <MainBackground>
                {deviceSelection && <DeviceSelector {...deviceSelection} />}
                {/* the page service only gives a conflict while the helper and the device lists are closed */}
                {pendingConflict && <PairingConflictDialog conflict={pendingConflict} />}

                <View style={styles.interfaceOverlay}>
                    {interfaces?.map((inter: InterfaceDisplayProps, index: number) => (
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

                <View style={styles.body}>
                    <View style={styles.main}>
                        {status && (
                            <View style={styles.statusRow}>
                                <PairingStatusLine
                                    status={status}
                                    variant={compact ? 'short' : 'full'}
                                    stateOnly={showBars}
                                    onLinkPress={onStatusLink}
                                />
                            </View>
                        )}

                        {showBars ? (
                            <ScrollView style={styles.rowFlex} contentContainerStyle={styles.barsContent}>
                                <CapabilityStatusBars capabilities={capabilities} />
                            </ScrollView>
                        ) : (
                            <View style={styles.gridArea}>
                                <CapabilityGrid capabilities={capabilities} compact={compact} />
                            </View>
                        )}

                        {/* exactly the page service's buttons, never filtered or added to */}
                        <View testID="pairing-page-buttons" style={styles.rowButtons}>
                            {props.buttons && <ButtonBar buttons={props.buttons} />}
                        </View>
                    </View>

                    {helperOpen && (
                        <View style={[styles.panel, panelStyle]}>
                            <PairingHelperPanel helper={helper} layout={panelLayout} />
                        </View>
                    )}
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

const styles = StyleSheet.create({
    statusRow: {
        marginBottom: 8,
    },
    container: {
        flex: 1,
        flexDirection: 'row',
    },
    rowTitle: {
        marginVertical: 5,
    },
    body: {
        flex: 1,
        flexDirection: 'row',
    },
    main: {
        flex: 1,
    },
    panel: {
        marginTop: PANEL_TOP_CLEARANCE,
        paddingBottom: 8,
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
    },
    gridArea: {
        flex: 1, // Takes up all available space
        justifyContent: 'center',
        alignItems: 'center',
    },
    barsContent: {
        flexGrow: 1,
        justifyContent: 'center',
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
