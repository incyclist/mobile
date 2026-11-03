import React, { useCallback } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { textSizes } from '../../theme/textSizes';
import { useLogging } from '../../hooks';
import { LinkButtonProps } from './types';

// The text stays small, but the tappable area must be at least 44x44 (two link buttons often sit on
// one line, so the slop is applied around the text rather than by growing the row)
const MIN_TOUCH_SIZE = 44;
const HIT_SLOP = { top: 12, bottom: 12, left: 8, right: 8 };

/**
 * A real button that looks like a text link. Logs the standard 'button clicked' event.
 */
export const LinkButton = ({ label, onPress, disabled = false, external = false }: LinkButtonProps) => {
    const { logEvent } = useLogging('Incyclist');

    const handlePress = useCallback(() => {
        if (disabled) {
            return;
        }
        logEvent({ message: 'button clicked', button: label, eventSource: 'user' });
        onPress();
    }, [disabled, label, logEvent, onPress]);

    const getStyle = useCallback(
        ({ pressed }: { pressed: boolean }) => [styles.pressable, pressed && styles.pressed],
        []
    );

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityHint={external ? 'Opens in your browser' : undefined}
            accessibilityState={{ disabled }}
            disabled={disabled}
            hitSlop={HIT_SLOP}
            onPress={handlePress}
            style={getStyle}
        >
            <Text style={[styles.text, disabled && styles.disabled]}>{external ? `${label} ↗` : label}</Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    pressable: {
        minHeight: MIN_TOUCH_SIZE,
        justifyContent: 'center',
    },
    pressed: {
        opacity: 0.6,
    },
    text: {
        color: colors.link,
        fontSize: textSizes.normalText,
        textDecorationLine: 'underline',
    },
    disabled: {
        color: colors.disabled,
        textDecorationLine: 'none',
    },
});
