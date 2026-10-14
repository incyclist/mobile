import React, { useCallback, useMemo } from 'react';
import { RideSettingsViewProps } from './types';
import { Dialog } from '../Dialog';
import { ChipSelect } from '../ChipSelect';
import { BinarySelect } from '../BinarySelect';

export const RideSettingsView = ({
    rideView,
    rideViewOptions,
    videoOptions,
    onClose,
    onChangeRideView,
    onChangeVideoAudio
}: RideSettingsViewProps) => {
    // ChipSelect's own contract is keyed by label (string), not by TRideView - map the
    // already-resolved {label, disabled, message} entries straight through.
    const options = useMemo(
        () =>
            Array.from(rideViewOptions.values()).map((option) => ({
                label: option.label,
                disabled: option.disabled,
                message: option.message,
            })),
        [rideViewOptions]
    );

    const selected = rideViewOptions.get(rideView)?.label;

    const handleChange = useCallback(
        (label: string) => {
            const entry = Array.from(rideViewOptions.entries()).find(
                ([, option]) => option.label === label
            );
            if (entry) onChangeRideView(entry[0]);
        },
        [rideViewOptions, onChangeRideView]
    );

    return (
        <Dialog
            title="Ride View"
            variant="full"
            onOutsideClick={onClose}
            buttons={[{ label: 'Close', primary: true, onClick: onClose }]}
        >
            <ChipSelect
                label="Select View"
                labelWidth={135}
                options={options}
                selected={selected}
                onValueChange={handleChange}
            />

            <BinarySelect
                label="Play video sound"
                labelWidth={135}
                onValueChange={onChangeVideoAudio}
                value={videoOptions?.enableAudio??false}
                />
        </Dialog>
    );
};
