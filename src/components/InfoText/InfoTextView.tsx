import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textSizes } from '../../theme';
import { InfoTextViewProps } from './types';

export const InfoTextView = (props: InfoTextViewProps) => {
    return (
        <View style={styles.outer} pointerEvents="none">
            <View style={styles.inner}>
                {props.lines.map((line, i) => (
                    <Text key={i} style={[styles.line, { textAlign: props.textAlign }]}>
                        {line}
                    </Text>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    outer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inner: {
        alignSelf: 'center',
        flexShrink: 0,
        minWidth: 400,
        minHeight: 100,
        maxWidth: '60%',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderRadius: 8,
        paddingHorizontal: 20,
        paddingVertical: 16,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
        elevation: 10,
    },
    line: {
        color: colors.text,
        fontSize: textSizes.normalText,
        lineHeight: textSizes.normalText * 1.5,
    },
});
