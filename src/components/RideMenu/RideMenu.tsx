import React, { useState, useCallback } from 'react';
import { RideMenuProps, ActiveDialog } from './types';
import { getRidePageService } from 'incyclist-services';
import { RideMenuView } from './RideMenuView';
import { useLogging } from '../../hooks';

export const RideMenu = ({ visible, onClose,onCloseRidePage=()=>{} }: RideMenuProps) => {
    const { logEvent } = useLogging('RideMenu');
    const service = getRidePageService();

    const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);

    // showResume is derived from service display props, which means it's current state
    const showResume = (service.getPageDisplayProps() as any)?.menuProps?.showResume ?? false;

    // Handles closing the menu, considering if a dialog is active
    const handleCloseMenu = useCallback(() => {
        if (activeDialog !== null) {
            setActiveDialog(null); // Close active dialog first if any
        } else {
            onClose(); // Only close menu if no dialog is active
        }
    }, [activeDialog, onClose]);

    // Handlers for menu actions that interact with the service and manage dialogs
    const handleEndRide = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'End Ride' });
        service.onPause();
        setActiveDialog('activitySummary');
    }, [service, logEvent]);

    const handleExitFromSummary = useCallback(() => {
        setActiveDialog(null);
        onCloseRidePage(); 
    }, [onCloseRidePage]);

    const handleGearSettings = useCallback(() => {
        setActiveDialog('gearSettings');
    }, []);

    const handleRideSettings = useCallback(() => {
        setActiveDialog('rideSettings');
    }, []);

    const handlePauseResume = useCallback(() => {
        if (showResume) {
            logEvent({ message: 'button clicked', button: 'Resume' });
            service.onResume();
        } else {
            logEvent({ message: 'button clicked', button: 'Pause' });
            service.onPause();
        }
        onClose(); // Close menu after action
    }, [showResume, service, logEvent, onClose]);

    // Generic handler to close any active dialog
    const handleDialogClose = useCallback(() => {
        setActiveDialog(null);
    }, []);

    return (
        <RideMenuView
            visible={visible}
            showResume={showResume}
            activeDialog={activeDialog}
            onClose={handleCloseMenu} // Pass the smart component's close handler
            onPause={handlePauseResume}
            onResume={handlePauseResume}
            onEndRide={handleEndRide}
            onGearSettings={handleGearSettings}
            onRideSettings={handleRideSettings}
            onDialogClose={handleDialogClose}
            onExitFromSummary={handleExitFromSummary}
        />
    );
};