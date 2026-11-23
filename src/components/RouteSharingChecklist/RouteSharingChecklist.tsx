import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textSizes } from '../../theme';
import { Button } from '../ButtonBar/ButtonBar';
import type { RouteSharingChecklistProps } from './types';
import { getChecklistItems, getChecklistTitle, LOCAL_NETWORK_HINT } from './utils';

const Item = ({ text }: { text: string }) => (
    <View style={styles.item}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.itemText}>{text}</Text>
    </View>
);

/** The shared "can't reach / can't find" checklist: never claims a specific cause. */
export const RouteSharingChecklist = ({ variant, name, showLocalNetworkHint, onOpenSettings }: RouteSharingChecklistProps) => {
    const items = getChecklistItems(variant, name);

    return (
        <View>
            <Text style={styles.title}>{getChecklistTitle(variant, name)}</Text>
            {items.map(text => <Item key={text} text={text} />)}
            {showLocalNetworkHint && <Item text={LOCAL_NETWORK_HINT} />}
            {showLocalNetworkHint && onOpenSettings && (
                <View style={styles.action}>
                    <Button label="Open iOS Settings" onClick={onOpenSettings} />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    title: {
        color: colors.text,
        fontSize: textSizes.normalText,
        fontWeight: '700',
        paddingBottom: 6,
    },
    item: {
        flexDirection: 'row',
        paddingVertical: 3,
    },
    bullet: {
        color: colors.text,
        fontSize: textSizes.normalText,
        width: 16,
    },
    itemText: {
        color: colors.text,
        fontSize: textSizes.normalText,
        flex: 1,
    },
    action: {
        alignSelf: 'flex-start',
        paddingTop: 4,
    },
});
