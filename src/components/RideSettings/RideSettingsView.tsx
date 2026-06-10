import React, { useCallback } from 'react';
import { RideSettingsViewProps } from './types';
import { Dialog } from '../Dialog';
import { ChipSelect } from '../ChipSelect';

export const RideSettingsView = ({
    rideView,
    rideViewOptions,
    onClose,
    onChangeRideView,
}: RideSettingsViewProps) => {
    const options = Array.from(rideViewOptions.values());
    const keys = Array.from(rideViewOptions.keys());

    const handleChange = useCallback((label: string) => {
        const index = options.indexOf(label);
        if (index !== -1) onChangeRideView(keys[index]);
    }, [options, keys, onChangeRideView]);

    return (
        <Dialog
            title="Ride View"
            variant="details"
            onOutsideClick={onClose}
            buttons={[{ label: 'Close', primary: true, onClick: onClose }]}
        >
            <ChipSelect
                label="Select View"
                options={options}
                selected={rideViewOptions.get(rideView)}
                onValueChange={handleChange}
            />
        </Dialog>
    );
};