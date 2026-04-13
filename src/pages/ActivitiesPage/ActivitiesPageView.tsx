import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { ActivitiesPageDisplayProps } from 'incyclist-services';
import { Dialog, ActivitiesTable } from '../../components';
import { colors, textSizes } from '../../theme';

export interface ActivitiesPageViewProps {
    props: ActivitiesPageDisplayProps | null;
    onSelectActivity: (id: string) => void;
    onClose: () => void;
}

export const ActivitiesPageView = ({ props, onSelectActivity, onClose }: ActivitiesPageViewProps) => {
    const buttons = useMemo(() => [{ label: 'Close', onClick: onClose }], [onClose]);

    const content = useMemo(() => {
        const activities = props?.activities ?? [];
        const isLoading = props?.loading ?? false;

        if (isLoading && activities.length === 0) {
            return (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.tileActive} />
                </View>
            );
        }

        if (!isLoading && activities.length === 0) {
            return (
                <View style={styles.center}>
                    <Text style={styles.emptyText}>No activities found</Text>
                </View>
            );
        }

        return <ActivitiesTable activities={activities} onSelect={onSelectActivity} />;
    }, [props, onSelectActivity]);

    return (
        <Dialog title="Activities" variant="full" onOutsideClick={onClose} buttons={buttons}>
            <View style={styles.container}>{content}</View>
        </Dialog>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        minHeight: 300,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        color: colors.text,
        fontSize: textSizes.noDataText,
        textAlign: 'center',
    },
});