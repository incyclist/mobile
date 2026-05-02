import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '../../Icon';
import { CompleteViewProps } from '../types';
import { colors, textSizes } from '../../../theme';

export const CompleteView = ({ count }: CompleteViewProps) => {
    return (
        <View style={styles.container}>
            <Icon name="plus" size={48} color={colors.buttonPrimary} />
            <Text style={styles.title}>Success!</Text>
            <Text style={styles.message}>
                {count === 1 ? '1 route has' : `${count} routes have`} been added to your library.
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        color: colors.text,
        fontSize: textSizes.dialogTitle,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    message: {
        color: colors.text,
        fontSize: textSizes.normalText,
        textAlign: 'center',
    },
});