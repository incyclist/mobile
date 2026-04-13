import React, { useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    ListRenderItem,
} from 'react-native';
import { ActivitiesPageDisplayProps, ActivityInfoUI } from 'incyclist-services';
import { Dialog, ActivityListItem } from '../../components';
import { ACTIVITY_LIST_ITEM_HEIGHT } from '../../components/ActivityListItem';
import { colors, textSizes } from '../../theme';

export interface ActivitiesPageViewProps {
    props: ActivitiesPageDisplayProps | null;
    onSelectActivity: (id: string) => void;
    onClose: () => void;
}

export const ActivitiesPageView = ({ props, onSelectActivity, onClose }: ActivitiesPageViewProps) => {
    const activities = props?.activities ?? [];
    const isLoading = props?.loading ?? false;

    const renderItem: ListRenderItem<ActivityInfoUI> = useCallback(({ item }) => (
        <ActivityListItem 
            activityInfo={item} 
            onPress={onSelectActivity} 
        />
    ), [onSelectActivity]);

    const keyExtractor = useCallback((item: ActivityInfoUI) => item.summary.id, []);

    const getItemLayout = useCallback((_: any, index: number) => ({
        length: ACTIVITY_LIST_ITEM_HEIGHT,
        offset: ACTIVITY_LIST_ITEM_HEIGHT * index,
        index,
    }), []);

    const buttons = useMemo(() => [
        { label: 'Close', onPress: onClose, type: 'secondary' as const }
    ], [onClose]);

    const content = useMemo(() => {
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

        return (
            <FlatList
                data={activities}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                getItemLayout={getItemLayout}
                windowSize={5}
                initialNumToRender={10}
                style={styles.list}
            />
        );
    }, [isLoading, activities, renderItem, keyExtractor, getItemLayout]);

    return (
        <Dialog
            title="Activities"
            variant="full"
            onOutsideClick={onClose}
            buttons={buttons}
        >
            <View style={styles.container}>
                {content}
            </View>
        </Dialog>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        minHeight: 300,
    },
    list: {
        flex: 1,
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