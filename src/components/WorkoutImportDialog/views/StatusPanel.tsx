import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '../../Icon';
import { IconName } from '../../Icon/types';
import { colors, textSizes } from '../../../theme';

interface StatusPanelProps {
    compact: boolean;
    icon: IconName;
    iconColor: string;
    title: string;
    message: string;
    /** Extra content rendered below the message, e.g. ResultView's group picker. */
    children?: React.ReactNode;
}

/**
 * Shared "icon circle + title + message" layout used by the terminal states of the
 * import dialogs (success and error). Extracted from ErrorView/ResultView, which were
 * otherwise near-identical (FIXES_BACKLOG.md item #63 - SonarCloud duplication).
 */
export const StatusPanel = ({ compact, icon, iconColor, title, message, children }: StatusPanelProps) => (
    <View style={[styles.container, compact && styles.containerCompact]}>
        <View style={[styles.iconCircle, compact && styles.iconCircleCompact, { borderColor: iconColor }]}>
            <Icon name={icon} size={compact ? 28 : 64} color={iconColor} />
        </View>
        <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
        <Text style={[styles.message, compact && styles.messageCompact]}>{message}</Text>
        {children}
    </View>
);

const styles = StyleSheet.create({
    container: {
        padding: 20,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 250,
    },
    containerCompact: {
        padding: 10,
        minHeight: 160,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    iconCircleCompact: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 3,
        marginBottom: 8,
    },
    title: {
        fontSize: textSizes.dialogTitle,
        color: colors.text,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
    },
    titleCompact: {
        fontSize: textSizes.listEntry,
        marginBottom: 4,
    },
    message: {
        fontSize: textSizes.normalText,
        color: colors.disabled,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    messageCompact: {
        fontSize: textSizes.smallText,
        paddingHorizontal: 10,
    },
});
