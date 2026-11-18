import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import type {
    DonationChannel,
    DonationClickId,
    SupportAppInfoDisplayProps,
    SupportDonationDisplayProps,
    SupportHelpLink,
    SupportLinkClickId,
} from 'incyclist-services';
import { colors, textSizes } from '../../theme';
import { useScreenLayout } from '../../hooks';
import { Dialog } from '../Dialog';
import { SupportSettingsViewProps } from './types';

type OpenUrl = (url: string, id: SupportLinkClickId) => void;
type Donate = (id: DonationClickId, url: string) => void;

const LinkText = ({ label, url, id, onOpenUrl }: { label: string; url: string; id: SupportLinkClickId; onOpenUrl: OpenUrl }) => {
    const handlePress = useCallback(() => onOpenUrl(url, id), [onOpenUrl, url, id]);
    return (
        <TouchableOpacity onPress={handlePress} accessibilityRole="link" style={styles.linkHitArea}>
            <Text style={styles.linkText}>{label}</Text>
        </TouchableOpacity>
    );
};

const InfoRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <View style={styles.infoValueBox}>{children}</View>
    </View>
);

const ShareUuidButton = ({ label, onShareUuid }: { label: string; onShareUuid: () => void }) => (
    <TouchableOpacity onPress={onShareUuid} accessibilityRole="button" style={styles.linkHitArea}>
        <Text style={styles.linkText}>{label}</Text>
    </TouchableOpacity>
);

const AppInfoTablet = ({ appInfo, onShareUuid, onOpenUrl }: { appInfo: SupportAppInfoDisplayProps; onShareUuid: () => void; onOpenUrl: OpenUrl }) => (
    <>
        <Text style={styles.sectionHeader}>{appInfo.title}</Text>
        <InfoRow label={appInfo.labels.appVersion}><Text style={styles.infoValue}>{appInfo.appVersion}</Text></InfoRow>
        <InfoRow label={appInfo.labels.uiVersion}><Text style={styles.infoValue}>{appInfo.uiVersion}</Text></InfoRow>
        <InfoRow label={appInfo.labels.uuid}>
            <Text style={styles.infoValue} selectable={true}>{appInfo.uuid}</Text>
            <ShareUuidButton label={appInfo.uuidActionLabel} onShareUuid={onShareUuid} />
        </InfoRow>
        <InfoRow label={appInfo.labels.privacy}>
            <LinkText label={appInfo.labels.privacyLink} url={appInfo.privacyUrl} id="privacy" onOpenUrl={onOpenUrl} />
        </InfoRow>
    </>
);

const HelpChip = ({ link, onOpenUrl }: { link: SupportHelpLink; onOpenUrl: OpenUrl }) => {
    const handlePress = useCallback(() => onOpenUrl(link.url, link.id), [onOpenUrl, link]);
    return (
        <TouchableOpacity onPress={handlePress} accessibilityRole="link" style={styles.chip}>
            <Text style={styles.chipText}>{link.shortLabel}</Text>
        </TouchableOpacity>
    );
};

const AppInfoPhone = ({ appInfo, helpTitle, helpLinks, onShareUuid, onOpenUrl }: {
    appInfo: SupportAppInfoDisplayProps;
    helpTitle: string;
    helpLinks: SupportHelpLink[];
    onShareUuid: () => void;
    onOpenUrl: OpenUrl;
}) => (
    <>
        <Text style={styles.sectionHeader}>{appInfo.title}</Text>
        <Text style={styles.infoValueLeft}>{appInfo.compactVersionText}</Text>
        <View style={styles.phoneUuidRow}>
            <Text style={styles.phoneUuid} selectable={true}>{appInfo.uuid}</Text>
            <ShareUuidButton label={appInfo.uuidActionLabel} onShareUuid={onShareUuid} />
        </View>
        <LinkText label={appInfo.labels.privacyLink} url={appInfo.privacyUrl} id="privacy" onOpenUrl={onOpenUrl} />

        <Text style={styles.sectionHeader}>{helpTitle}</Text>
        <View style={styles.chipRow}>
            {helpLinks.map(link => <HelpChip key={link.id} link={link} onOpenUrl={onOpenUrl} />)}
        </View>
    </>
);

const HelpRow = ({ link, onOpenUrl, onShareDetails }: { link: SupportHelpLink; onOpenUrl: OpenUrl; onShareDetails: () => void }) => (
    <InfoRow label={link.shortLabel}>
        <LinkText label={link.label} url={link.url} id={link.id} onOpenUrl={onOpenUrl} />
        {link.email && (
            <TouchableOpacity onPress={onShareDetails} accessibilityRole="button" style={styles.linkHitArea}>
                <Text style={styles.secondaryActionText}>{link.email.copyLabel}</Text>
            </TouchableOpacity>
        )}
    </InfoRow>
);

const HelpTablet = ({ title, links, onOpenUrl, onShareDetails }: {
    title: string;
    links: SupportHelpLink[];
    onOpenUrl: OpenUrl;
    onShareDetails: () => void;
}) => (
    <>
        <Text style={styles.sectionHeader}>{title}</Text>
        {links.map(link => <HelpRow key={link.id} link={link} onOpenUrl={onOpenUrl} onShareDetails={onShareDetails} />)}
    </>
);

const DonateButton = ({ channel, onDonate, stacked }: { channel: DonationChannel; onDonate: Donate; stacked: boolean }) => {
    const handlePress = useCallback(() => onDonate(channel.id, channel.url), [onDonate, channel]);
    const buttonStyle = [styles.donateButton, channel.primary ? styles.donatePrimary : styles.donateSecondary, !stacked && styles.donateSideBySide];
    const labelStyle = channel.primary ? styles.donateLabelPrimary : styles.donateLabelSecondary;
    return (
        <TouchableOpacity onPress={handlePress} accessibilityRole="button" accessibilityLabel={channel.label} style={buttonStyle}>
            <Text style={labelStyle}>{channel.label}</Text>
            <Text style={labelStyle}>{channel.subLabel}</Text>
        </TouchableOpacity>
    );
};

const WebsiteButton = ({ link, onDonate }: { link: NonNullable<SupportDonationDisplayProps['websiteLink']>; onDonate: Donate }) => {
    const handlePress = useCallback(() => onDonate('website', link.url), [onDonate, link]);
    return (
        <TouchableOpacity onPress={handlePress} accessibilityRole="button" accessibilityLabel={link.label} style={[styles.donateButton, styles.donatePrimary]}>
            <Text style={styles.donateLabelPrimary}>{link.label}</Text>
            <Text style={styles.donateLabelPrimary}>{link.host}</Text>
        </TouchableOpacity>
    );
};

const DonationCard = ({ donation, stacked, onDonate, onOpenUrl }: {
    donation: SupportDonationDisplayProps;
    stacked: boolean;
    onDonate: Donate;
    onOpenUrl: OpenUrl;
}) => (
    <View style={styles.card}>
        <Text style={styles.cardTitle}>{donation.title}</Text>
        <Text style={styles.cardText}>{donation.promise}</Text>
        {donation.fundsText ? <Text style={styles.cardText}>{donation.fundsText}</Text> : null}

        {donation.mode === 'website' && donation.websiteLink && (
            <View style={styles.buttonGroup}>
                <WebsiteButton link={donation.websiteLink} onDonate={onDonate} />
            </View>
        )}
        {donation.mode === 'direct' && donation.channels.length > 0 && (
            <View style={stacked ? styles.buttonGroup : styles.buttonGroupRow}>
                {donation.channels.map(channel => (
                    <DonateButton key={channel.id} channel={channel} onDonate={onDonate} stacked={stacked} />
                ))}
            </View>
        )}

        <Text style={styles.note}>{donation.note}</Text>
        <View style={styles.otherLinks}>
            {donation.otherHelpLinks.map(link => (
                <LinkText key={link.url} label={link.label} url={link.url} id={link.id} onOpenUrl={onOpenUrl} />
            ))}
        </View>
    </View>
);

export const SupportSettingsView = ({
    displayProps,
    compact,
    onClose,
    onShareUuid,
    onOpenUrl,
    onDonate,
    onShareDetails,
}: SupportSettingsViewProps) => {
    const layout = useScreenLayout();
    const isPhone = compact ?? layout === 'compact';

    const leftColumnStyle = [styles.leftColumn, isPhone ? styles.leftColumnPhone : styles.leftColumnTablet];

    return (
        <Dialog
            title="Support"
            variant="full"
            visible={true}
            scrollable={false}
            onOutsideClick={onClose}
            buttons={[{ label: 'Close', primary: true, onClick: onClose }]}
        >
            {displayProps && (
                <View style={styles.columns}>
                    <ScrollView style={leftColumnStyle} bounces={false}>
                        {isPhone ? (
                            <AppInfoPhone
                                appInfo={displayProps.appInfo}
                                helpTitle={displayProps.helpTitle}
                                helpLinks={displayProps.helpLinks}
                                onShareUuid={onShareUuid}
                                onOpenUrl={onOpenUrl}
                            />
                        ) : (
                            <AppInfoTablet appInfo={displayProps.appInfo} onShareUuid={onShareUuid} onOpenUrl={onOpenUrl} />
                        )}
                    </ScrollView>
                    <ScrollView style={styles.rightColumn} bounces={false}>
                        {!isPhone && (
                            <HelpTablet
                                title={displayProps.helpTitle}
                                links={displayProps.helpLinks}
                                onOpenUrl={onOpenUrl}
                                onShareDetails={onShareDetails}
                            />
                        )}
                        <DonationCard donation={displayProps.donation} stacked={isPhone} onDonate={onDonate} onOpenUrl={onOpenUrl} />
                    </ScrollView>
                </View>
            )}
        </Dialog>
    );
};

const styles = StyleSheet.create({
    columns: {
        flex: 1,
        flexDirection: 'row',
    },
    leftColumn: {
        paddingHorizontal: 16,
    },
    leftColumnTablet: {
        flex: 36,
    },
    leftColumnPhone: {
        flex: 44,
    },
    rightColumn: {
        flex: 64,
        paddingHorizontal: 16,
    },
    sectionHeader: {
        color: colors.text,
        fontSize: textSizes.normalText,
        fontWeight: '700',
        paddingTop: 12,
        paddingBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        minHeight: 40,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(238, 238, 238, 0.1)',
    },
    infoLabel: {
        color: colors.text,
        fontSize: textSizes.normalText,
        flex: 1,
    },
    infoValueBox: {
        flex: 2,
        alignItems: 'flex-end',
    },
    infoValue: {
        color: colors.text,
        fontSize: textSizes.normalText,
        textAlign: 'right',
    },
    infoValueLeft: {
        color: colors.text,
        fontSize: textSizes.normalText,
    },
    phoneUuidRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    phoneUuid: {
        color: colors.text,
        fontSize: textSizes.smallText,
        flex: 1,
    },
    linkHitArea: {
        minHeight: 44,
        justifyContent: 'center',
    },
    linkText: {
        color: colors.link,
        fontSize: textSizes.normalText,
        textDecorationLine: 'underline',
    },
    secondaryActionText: {
        color: colors.link,
        fontSize: textSizes.smallText,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        minWidth: 44,
        minHeight: 44,
        justifyContent: 'center',
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.link,
    },
    chipText: {
        color: colors.link,
        fontSize: textSizes.smallText,
    },
    card: {
        marginTop: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(238, 238, 238, 0.3)',
        backgroundColor: colors.listItemBackground,
    },
    cardTitle: {
        color: colors.text,
        fontSize: textSizes.normalText,
        fontWeight: '700',
        marginBottom: 8,
    },
    cardText: {
        color: colors.text,
        fontSize: textSizes.normalText,
        marginBottom: 8,
    },
    buttonGroup: {
        gap: 8,
        marginVertical: 8,
    },
    buttonGroupRow: {
        flexDirection: 'row',
        gap: 8,
        marginVertical: 8,
    },
    donateButton: {
        minHeight: 44,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 8,
    },
    donateSideBySide: {
        flex: 1,
    },
    donatePrimary: {
        backgroundColor: colors.buttonPrimary,
    },
    donateSecondary: {
        borderWidth: 1,
        borderColor: colors.buttonSecondary,
    },
    donateLabelPrimary: {
        color: '#000000',
        fontSize: textSizes.smallText,
        fontWeight: '600',
    },
    donateLabelSecondary: {
        color: colors.text,
        fontSize: textSizes.smallText,
        fontWeight: '600',
    },
    note: {
        color: colors.disabled,
        fontSize: textSizes.smallText,
        lineHeight: 18,
    },
    otherLinks: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        columnGap: 16,
    },
});
