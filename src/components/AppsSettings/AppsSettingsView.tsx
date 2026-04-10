import React, { useCallback } from 'react'
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { SvgUri } from 'react-native-svg'
import { colors } from '../../theme/colors'
import { textSizes } from '../../theme/textSizes'
import type { AppDisplayProps, AppsSettingsViewProps } from './types'

// ---------------------------------------------------------------------------
// Sub-components (defined outside to avoid react/no-unstable-nested-components)
// ---------------------------------------------------------------------------

interface AppIconProps {
    iconUrl: string
}

const AppIcon = ({ iconUrl }: AppIconProps) => {
    const isSvg = iconUrl.endsWith('.svg')
    if (isSvg) {
        return (
            <View style={styles.iconWrapper}>
                <SvgUri uri={iconUrl} width={32} height={32} />
            </View>
        )
    }
    return (
        <View style={styles.iconWrapper}>
            <Image source={{ uri: iconUrl }} style={styles.iconImage} />
        </View>
    )
}

interface ConnectedBadgeProps {
    isConnected: boolean
}

const ConnectedBadge = ({ isConnected }: ConnectedBadgeProps) => (
    <View
        style={[
            styles.badge,
            isConnected ? styles.badgeConnected : styles.badgeDisconnected,
        ]}
    />
)

interface AppRowProps {
    app: AppDisplayProps
    compact: boolean
    onPress: (key: string) => void
}

const AppRow = ({ app, compact, onPress }: AppRowProps) => {
    const handlePress = useCallback(() => {
        onPress(app.key)
    }, [onPress, app.key])

    return (
        <TouchableOpacity
            style={[styles.row, compact && styles.rowCompact]}
            onPress={handlePress}
            activeOpacity={0.7}
        >
            <AppIcon iconUrl={app.iconUrl} />
            <Text style={[styles.appName, compact && styles.appNameCompact]}>
                {app.name}
            </Text>
            <View style={styles.trailingGroup}>
                <ConnectedBadge isConnected={app.isConnected} />
                <Text style={styles.chevron}>{'›'}</Text>
            </View>
        </TouchableOpacity>
    )
}

// ---------------------------------------------------------------------------
// View
// ---------------------------------------------------------------------------

export const AppsSettingsView = ({
    apps,
    onSelect,
    compact = false,
}: AppsSettingsViewProps) => {
    const handleSelect = useCallback(
        (key: string) => {
            onSelect?.(key)
        },
        [onSelect],
    )

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
        >
            {(apps ?? []).map((app) => (
                <AppRow
                    key={app.key}
                    app={app}
                    compact={compact}
                    onPress={handleSelect}
                />
            ))}
        </ScrollView>
    )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    contentContainer: {
        paddingVertical: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.disabled,
    },
    rowCompact: {
        paddingVertical: 8,
    },
    iconWrapper: {
        width: 32,
        height: 32,
        marginRight: 14,
        overflow: 'hidden',
    },
    iconImage: {
        width: 32,
        height: 32,
    },
    appName: {
        flex: 1,
        color: colors.text,
        fontSize: textSizes.listEntry,
    },
    appNameCompact: {
        fontSize: textSizes.normalText,
    },
    trailingGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    badge: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    badgeConnected: {
        backgroundColor: '#4CAF50',
    },
    badgeDisconnected: {
        backgroundColor: colors.disabled,
    },
    chevron: {
        color: colors.text,
        fontSize: textSizes.listEntry,
    },
})