import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, textSizes } from '../../theme';
import { SupportSettingsViewProps } from './types';
import { Dialog } from '../Dialog';

export const SupportSettingsView = ({
    displayProps,
    onClose,
    onShareUuid,
    onOpenUrl,
}: SupportSettingsViewProps) => {
    return (
        <Dialog
            title="Support"
            variant="full"
            visible={true}
            onOutsideClick={onClose}
        >
            {displayProps && (
                <>
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
                </>
            )}
        </Dialog>
    );
};

const styles = StyleSheet.create({
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