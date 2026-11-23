import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, textSizes } from '../../theme';
import { useScreenLayout } from '../../hooks';
import { Dialog } from '../Dialog';
import { Icon } from '../Icon';
import type { RoutesCard, RoutesCardKey, RoutesSettingsViewProps } from './types';

interface CardProps {
    card: RoutesCard;
    compact: boolean;
    onOpen: (key: RoutesCardKey) => void;
}

const Card = ({ card, compact, onOpen }: CardProps) => {
    const handlePress = () => onOpen(card.key);
    const summaryStyle = [styles.summary, card.summary.warning && styles.summaryWarning];

    return (
        <TouchableOpacity
            style={[styles.card, compact && styles.cardCompact]}
            onPress={handlePress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${card.title}. ${card.description} ${card.summary.text}`}
        >
            <View style={styles.iconContainer}>
                <Icon name={card.icon} size={compact ? 24 : 32} color={colors.icon} />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.title}>{card.title}</Text>
                <Text style={styles.description}>{card.description}</Text>
                <Text style={summaryStyle}>{card.summary.text}</Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.icon} />
        </TouchableOpacity>
    );
};

export const RoutesSettingsView = ({ cards, compact, onOpenCard, onClose }: RoutesSettingsViewProps) => {
    const layout = useScreenLayout();
    const isPhone = compact ?? layout === 'compact';
    const buttons = useMemo(() => [{ label: 'Close', onClick: onClose, primary: true }], [onClose]);

    return (
        <Dialog
            title="Routes"
            variant="full"
            visible={true}
            scrollable={false}
            onOutsideClick={onClose}
            buttons={buttons}
        >
            <ScrollView style={styles.scroll} bounces={false}>
                {cards.map(card => (
                    <Card key={card.key} card={card} compact={isPhone} onOpen={onOpenCard} />
                ))}
            </ScrollView>
        </Dialog>
    );
};

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.listItemBackground,
        borderRadius: 8,
        padding: 16,
        marginVertical: 8,
    },
    cardCompact: {
        padding: 12,
        marginVertical: 4,
    },
    iconContainer: {
        marginRight: 16,
        width: 40,
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: textSizes.listEntry,
        color: colors.text,
        fontWeight: '700',
    },
    description: {
        fontSize: textSizes.smallText,
        color: colors.disabled,
        marginTop: 2,
    },
    summary: {
        fontSize: textSizes.smallText,
        color: colors.text,
        marginTop: 6,
    },
    summaryWarning: {
        color: colors.warning,
    },
});
