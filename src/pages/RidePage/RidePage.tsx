import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { getRidePageService, RideType, StartGateProps } from 'incyclist-services';
import { MainBackground, Button, Dialog, ButtonBar } from '../../components';
import { VideoRidePage } from './Video';
import { colors } from '../../theme';
import { textSizes } from '../../theme';
import { initSecrets } from '../../bindings/secret';

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
    const refPendingType = useRef<RideType | null>(null);
    const [rideType, setRideType] = useState<RideType | null>(null);
    const [startGateProps, setStartGateProps] = useState<StartGateProps | null>(null);
    const service = getRidePageService();

    const onRideTypeChange = useCallback((updated: RideType) => {
        setRideType(updated);
    }, []);

    const onRefreshSecrets = useCallback(async () => {
        await initSecrets({ timeout: 10000 });
        service.onRefreshSecrets();
        setStartGateProps(null);
        if (refPendingType.current) {
            setRideType(refPendingType.current);
        }
    }, [service]);

    const onContinueAnyway = useCallback(() => {
        service.onContinueAnyway();
        setStartGateProps(null);
        if (refPendingType.current) {
            setRideType(refPendingType.current);
        }
    }, [service]);

    useEffect(() => {
        if (refInitialized.current) return;
        refInitialized.current = true;

        service.initPage().then(type => {
            const props = service.getPageDisplayProps();
            if (props?.startGateProps) {
                refPendingType.current = type;
                setStartGateProps(props.startGateProps);
            } else {
                setRideType(type);
            }
        });
    }, [service]);

    if (rideType === null) {
        return (
            <>
                <NotImplementedView onBack={() => service.onEndRide()} />
                {startGateProps && (
                    <Dialog
                        title={startGateProps.title}
                        variant="info"
                        presentationStyle="overFullScreen"
                        supportedOrientations={['landscape']}
                        buttons={
                            <ButtonBar>
                                <Button id="connect" label="Connect now" primary onClick={onRefreshSecrets} />
                                <Button id="continue" label="Continue anyway" onClick={onContinueAnyway} />
                            </ButtonBar>
                        }
                    >
                        <Text style={styles.gateBody}>{startGateProps.body}</Text>
                    </Dialog>
                )}
            </>
        );
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
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
},
message: {
    color: colors.text,
    fontSize: textSizes.noDataText,
},
gateBody: {
    color: colors.text,
    fontSize: textSizes.normalText,
    textAlign: 'center',
},
});