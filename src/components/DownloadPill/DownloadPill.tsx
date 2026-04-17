import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet
} from 'react-native';
import { colors, textSizes } from '../../theme';

interface DownloadPillProps {
    activeDownloadCount: number;
    onPress: () => void;
}

export const DownloadPill = ({ activeDownloadCount, onPress }: DownloadPillProps) => {
    if (activeDownloadCount === 0) {
        return null;
    }

    return (
        <TouchableOpacity
            style={styles.downloadPill}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Text style={styles.downloadPillText}>↓ {activeDownloadCount}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    downloadPill: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.buttonPrimary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginRight: 8,
    },
    downloadPillText: {
        color: colors.buttonPrimary,
        fontSize: textSizes.normalText,
        fontWeight: '600',
    },
});