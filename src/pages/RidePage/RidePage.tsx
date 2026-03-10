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

interface NotImplementedViewProps {
    onBack:()=>void
}

const NotImplementedView = ( {onBack}:NotImplementedViewProps) => {
    
    return (
        <View style={styles.container}>
            <MainBackground />
            <View style={styles.content}>
                <Text style={styles.message}>Not yet implemented</Text>
                <Button id='back' label='Back' primary onClick={onBack} />
            </View>
        </View>
    );
};

export const RidePage = ({ simulate = false }: RidePageProps) => {
    const refInitialized = useRef(false);
    const [rideType, setRideType] = useState<RideType | null>(null);
    const service = getRidePageService()

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
        return <NotImplementedView onBack={()=>service.onEndRide()}/>;
    }

    if (rideType === 'Video') {
        return <VideoRidePage simulate={simulate} onRideTypeChange={onRideTypeChange} />;
    }

    // Default case for any other rideType not explicitly handled
    return <NotImplementedView onBack={()=>service.onEndRide()}/>;
};

const styles = StyleSheet.create({
container: {
    flex: 1,
},
content: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
},
message: {
    color: colors.text,
    fontSize: textSizes.noDataText,
},
});
