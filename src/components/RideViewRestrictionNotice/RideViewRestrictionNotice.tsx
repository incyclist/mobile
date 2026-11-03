import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { RideViewNoticeActionId } from 'incyclist-services';
import { colors } from '../../theme';
import { textSizes } from '../../theme/textSizes';
import { useIsTablet, useLogging } from '../../hooks';
import { LinkButton } from '../LinkButton';
import { RideViewRestrictionNoticeComponentProps } from './types';

// long enough to reach the actions, unlike the text-only notices
const DISMISS_AFTER = 12000;
const PHONE_WIDTH = '80%';
const TABLET_WIDTH = '90%';

/**
 * In-ride notice that explains why the Map is shown instead of Street View/Satellite View,
 * with link-style actions and a close button.
 *
 * Unlike RideViewNotice, the service prop is stateful and identified by `notice.id`: the
 * message is replaced in place by an acknowledgement, and one timer runs for the whole id.
 * Only the actions and the close button take touches - swipes on the ride view still work.
 */
export const RideViewRestrictionNotice = ({ notice, onAction, onClose }: RideViewRestrictionNoticeComponentProps) => {
    // same logger and event shape as InfoText, so the notices can be analysed together
    const { logEvent } = useLogging('InfoText');
    const { logEvent: logClick } = useLogging('Incyclist');
    const isTablet = useIsTablet();
    const [closedId, setClosedId] = useState<number | undefined>(undefined);
    const refTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const refShownId = useRef<number | undefined>(undefined);

    const id = notice?.id;

    const close = useCallback(() => {
        if (refTimer.current) {
            clearTimeout(refTimer.current);
            refTimer.current = null;
        }
        logEvent({ message: 'Infotext closed' });
        setClosedId(id);
        onClose();
    }, [id, logEvent, onClose]);

    const text = notice?.text;
    useEffect(() => {
        if (id === undefined) {
            refShownId.current = undefined;
            return;
        }
        if (id === refShownId.current) {
            return;
        }
        refShownId.current = id;
        logEvent({ message: 'Infotext shown', text, routeDistance: id });
        refTimer.current = setTimeout(close, DISMISS_AFTER);
    }, [id, text, close, logEvent]);

    useEffect(() => () => {
        if (refTimer.current) {
            clearTimeout(refTimer.current);
            refTimer.current = null;
        }
    }, []);

    const handleClosePress = useCallback(() => {
        logClick({ message: 'button clicked', button: 'Close', eventSource: 'user' });
        close();
    }, [close, logClick]);

    if (!notice || closedId === notice.id) {
        return null;
    }

    const toastStyle = { width: isTablet ? TABLET_WIDTH : PHONE_WIDTH } as const;

    return (
        <View style={styles.container} pointerEvents="box-none">
            <View style={[styles.toast, toastStyle]}>
                <View style={styles.content}>
                    {notice.text ? <Text style={styles.text}>{notice.text}</Text> : null}
                    <View style={styles.actions}>
                        {notice.actions.map((action) => (
                            <NoticeAction key={action.id} id={action.id} label={action.label} onAction={onAction} />
                        ))}
                    </View>
                </View>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    hitSlop={8}
                    onPress={handleClosePress}
                    style={styles.close}
                >
                    <Text style={styles.closeText}>✕</Text>
                </Pressable>
            </View>
        </View>
    );
};

interface NoticeActionProps {
    id: RideViewNoticeActionId;
    label: string;
    onAction: (id: RideViewNoticeActionId) => void;
}

const NoticeAction = ({ id, label, onAction }: NoticeActionProps) => {
    const handlePress = useCallback(() => onAction(id), [id, onAction]);
    return (
        <View style={styles.action}>
            <LinkButton label={label} onPress={handlePress} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: '4%',
        alignItems: 'center',
        zIndex: 20,
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(25,25,25,0.85)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.45)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    content: {
        flex: 1,
        paddingTop: 8,
    },
    text: {
        color: colors.text,
        fontSize: textSizes.normalText,
    },
    actions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        columnGap: 24,
    },
    action: {
        // keeps "Don't show this again" apart from the first link
        alignItems: 'flex-start',
    },
    close: {
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeText: {
        color: colors.text,
        fontSize: textSizes.normalText,
    },
});
