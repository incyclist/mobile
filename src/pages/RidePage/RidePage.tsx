import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getRidePageService, RideType } from 'incyclist-services';
import { MainBackground, Button } from '../../components';
import { VideoRidePage } from './Video';
import { colors } from '../../theme';
import { textSizes } from '../../theme';

interface RidePageProps {
    simulate?: boolean;
}

const NotImplementedView = () => {
    const navigation = useNavigation();
    return (
        <View style={styles.container}>
            <MainBackground />
            <View style={styles.content}>
                <Text style={styles.message}>Not yet implemented</Text>
                <Button id='back' label='Back' primary={false} onClick={() => navigation.goBack()} />
            </View>
        </View>
    );
};

export const RidePage = ({ simulate = false }: RidePageProps) => {
    const refInitialized = useRef(false);
    const [rideType, setRideType] = useState<RideType | null>(null);

    const onRideTypeChange = useCallback((updated: RideType) => {
        setRideType(updated);
    }, []);

    useEffect(() => {
        if (refInitialized.current) return;
        refInitialized.current = true;

        getRidePageService().initPage().then(type => {
            setRideType(type);
        });
    }, []);

    if (rideType === null) {
        return <NotImplementedView />;
    }

    if (rideType === 'Video') {
        return <VideoRidePage simulate={simulate} onRideTypeChange={onRideTypeChange} />;
    }

    // Default case for any other rideType not explicitly handled
    return <NotImplementedView />;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
    },
    message: {
        color: colors.text,
        fontSize: textSizes.normalText,
    },
});
