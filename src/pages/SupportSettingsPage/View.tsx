import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, textSizes } from '../../theme';
import { SupportSettingsViewProps } from './types';

export const SupportSettingsView = ({
    displayProps,
    onBack,
    onShareUuid,
    onOpenUrl,
}: SupportSettingsViewProps) => {
    if (!displayProps) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <Text style={styles.backButtonText}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Support</Text>
                </View>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} bounces={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Support</Text>
            </View>

            <Text style={styles.sectionHeader}>App Info</Text>
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>App Version</Text>
                <Text style={styles.infoValue}>{displayProps.appVersion}</Text>
            </View>
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>UI Version</Text>
                <Text style={styles.infoValue}>{displayProps.uiVersion}</Text>
            </View>
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>UUID</Text>
                <View style={styles.uuidValueContainer}>
                    <Text style={styles.infoValue} selectable={true}>
                        {displayProps.uuid}
                    </Text>
                    <TouchableOpacity onPress={onShareUuid} style={styles.shareButton}>
                        <Text style={styles.linkText}>Share</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Privacy</Text>
                <TouchableOpacity onPress={() => onOpenUrl(displayProps.privacyUrl)}>
                    <Text style={styles.linkText}>Privacy Policy</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionHeader}>Where can I get support?</Text>
            {displayProps.supportUrls.map((item, index) => (
                <View key={`${item.label}-${index}`} style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{item.label}</Text>
                    <TouchableOpacity onPress={() => onOpenUrl(item.url)}>
                        <Text style={styles.linkText}>{item.text}</Text>
                    </TouchableOpacity>
                </View>
            ))}

            <Text style={styles.sectionHeader}>How can I support?</Text>
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Coding</Text>
                <TouchableOpacity onPress={() => onOpenUrl(displayProps.gitHubUrl)}>
                    <Text style={styles.linkText}>GitHub</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Donation</Text>
                <TouchableOpacity onPress={() => onOpenUrl(displayProps.donationUrl)}>
                    <Text style={styles.linkText}>Incyclist Paypal</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.disclaimer}>
                Donation is 100% voluntarily. Incyclist remains a 100% free app regardless of donation.
                No freemium model is planned.
            </Text>
            <View style={styles.footerSpacer} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.listSeparator,
    },
    backButton: {
        marginRight: 16,
        padding: 4,
    },
    backButtonText: {
        color: colors.text,
        fontSize: 32,
        lineHeight: 36,
    },
    headerTitle: {
        color: colors.text,
        fontSize: textSizes.pageTitle,
        fontWeight: '600',
    },
    sectionHeader: {
        color: colors.text,
        fontSize: textSizes.normalText,
        fontWeight: '700',
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(238, 238, 238, 0.1)',
    },
    infoLabel: {
        color: colors.text,
        fontSize: textSizes.normalText,
        flex: 1,
    },
    infoValue: {
        color: colors.text,
        fontSize: textSizes.normalText,
        textAlign: 'right',
        flex: 2,
    },
    uuidValueContainer: {
        flex: 3,
        alignItems: 'flex-end',
    },
    shareButton: {
        marginTop: 4,
    },
    linkText: {
        color: colors.selected,
        fontSize: textSizes.normalText,
        textDecorationLine: 'underline',
    },
    disclaimer: {
        color: colors.disabled,
        fontSize: textSizes.smallText,
        paddingHorizontal: 20,
        paddingTop: 12,
        lineHeight: 20,
    },
    footerSpacer: {
        height: 40,
    },
});