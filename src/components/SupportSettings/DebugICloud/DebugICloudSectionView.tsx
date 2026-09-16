import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, textSizes } from '../../../theme'
import { DebugICloudSectionViewProps } from './types'

const BUTTONS: Array<{ label: string, action: keyof DebugICloudSectionViewProps }> = [
    { label: 'Pick folder', action: 'onPickFolder' },
    { label: 'Probe (no grant)', action: 'onProbeNoGrant' },
    { label: 'Probe (with grant)', action: 'onProbeWithGrant' },
    { label: 'Capture grant from path', action: 'onCaptureGrant' },
    { label: 'Probe (captured grant only)', action: 'onProbeCaptured' },
    { label: 'Download largest video', action: 'onDownloadLargest' },
    { label: 'Evict largest video', action: 'onEvictLargest' },
    { label: 'Read first control file (plain)', action: 'onReadControlFilePlain' },
    { label: 'Open picker at last folder', action: 'onOpenPickerAtLastFolder' },
    { label: 'Identity token', action: 'onIdentityToken' },
]

export const DebugICloudSectionView = (props: DebugICloudSectionViewProps) => {
    return (
        <View testID="debug-icloud-section">
            <Text style={styles.sectionHeader}>Debug iCloud</Text>
            <Text style={styles.hint}>Temporary - results are written to the event log, prefixed [DEBUG-ICLD].</Text>
            {BUTTONS.map(({ label, action }) => (
                <TouchableOpacity key={label} style={styles.row} onPress={props[action]}>
                    <Text style={styles.rowLabel}>{label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    )
}

const styles = StyleSheet.create({
    sectionHeader: {
        color: colors.text,
        fontSize: textSizes.normalText,
        fontWeight: '700',
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 8,
    },
    hint: {
        color: colors.disabled,
        fontSize: textSizes.smallText,
        paddingHorizontal: 20,
        paddingBottom: 8,
    },
    row: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(238, 238, 238, 0.1)',
    },
    rowLabel: {
        color: colors.selected,
        fontSize: textSizes.normalText,
    },
})
