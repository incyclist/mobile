import React, { useCallback, useRef } from 'react';
import { ScrollView } from 'react-native';
import { useScreenLayout } from '../../hooks';
import { Dialog } from '../Dialog';
import type { AddComputerDialogViewProps } from './types';
import { getButtons } from './buttons';
import {
    BlockedScreen, CodeScreen, ConnectedScreen, ConnectingScreen, FailedScreen, NoneFoundScreen, NotReadyScreen, SearchScreen,
} from './Screens';
import { AddComputerScreen, getScreen, secondsLeft } from './utils';

interface ContentProps extends AddComputerDialogViewProps {
    screen: AddComputerScreen;
    compact: boolean;
    seconds: number;
    onNameChange: (name: string) => void;
}

const Content = (props: ContentProps) => {
    const { screen, compact, seconds, discovery, routeCount, syncDone } = props;
    switch (screen.kind) {
        case 'blocked':
            return <BlockedScreen />;
        case 'none':
            return <NoneFoundScreen showLocalNetworkHint={screen.showLocalNetworkHint} />;
        case 'connecting':
            return <ConnectingScreen name={screen.name} />;
        case 'not-ready':
            return <NotReadyScreen name={screen.name} />;
        case 'code':
            return (
                <CodeScreen
                    name={screen.name}
                    wrong={screen.wrong}
                    attemptsLeft={screen.attemptsLeft}
                    compact={compact}
                    onSubmitCode={props.onSubmitCode}
                    onCancel={props.onCancel}
                    onBack={props.onBack}
                />
            );
        case 'failed':
            return <FailedScreen name={screen.name} reason={screen.reason} seconds={seconds} />;
        case 'connected':
            return (
                <ConnectedScreen
                    name={screen.name}
                    already={screen.already}
                    routeCount={routeCount}
                    syncDone={syncDone}
                    onNameChange={props.onNameChange}
                />
            );
        default:
            return <SearchScreen discovery={discovery} onSelect={props.onSelect} onSearchAgain={props.onSearchAgain} />;
    }
};

export const AddComputerDialogView = (props: AddComputerDialogViewProps) => {
    const { discovery, pairing, now, compact: compactProp, onCancel, onSearchAgain, onRetry, onBack, onOpenIosSettings, onDone } = props;
    const layout = useScreenLayout();
    const compact = compactProp ?? layout === 'compact';
    const refName = useRef<string | undefined>(undefined);

    const screen = getScreen(discovery, pairing);
    const seconds = screen.kind === 'failed' ? secondsLeft(screen.retryAt, now ?? Date.now()) : 0;

    const handleNameChange = useCallback((name: string) => { refName.current = name; }, []);
    const handleDone = useCallback(() => {
        onDone(refName.current ?? (pairing.step === 'connected' ? pairing.name : ''));
    }, [onDone, pairing]);

    const buttons = getButtons(screen, { onCancel, onSearchAgain, onRetry, onBack, onOpenIosSettings, onDone: handleDone }, compact, seconds);

    return (
        <Dialog title="Add Computer" variant="full" visible={true} scrollable={false} onOutsideClick={onCancel} buttons={buttons}>
            <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
                <Content {...props} screen={screen} compact={compact} seconds={seconds} onNameChange={handleNameChange} />
            </ScrollView>
        </Dialog>
    );
};
