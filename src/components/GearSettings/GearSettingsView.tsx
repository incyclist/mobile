import React from 'react';
import { StyleSheet } from 'react-native';
import { CyclingModeProperty, CyclingModeProperyType, Settings } from 'incyclist-services';
import { GearSettingsViewProps } from './types';
import { Dialog } from '../Dialog';
import { SingleSelect } from '../SingleSelect';
import { EditNumber } from '../EditNumber';
import { EditText } from '../EditText';
import { ChipSelect } from '../ChipSelect';

/**
 * Pure view for GearSettings
 */
export const GearSettingsView = ({
    mode,
    options,
    settings,
    properties,
    onClose,
    onChangeMode,
    onChangeSetting,
}: GearSettingsViewProps) => {
    const modeOptions = options.map((m) => m.getName());
    const visibleProperties = properties.filter((p) => !p.condition || p.condition(settings));

    return (
        <Dialog title="Bike Preferences" variant="full" visible={true} onOutsideClick={onClose}>
            <SingleSelect
                label="Mode"
                options={modeOptions}
                selected={mode}
                onValueChange={onChangeMode}
            />
            {visibleProperties.map((p) => renderProperty(p, settings, onChangeSetting))}
        </Dialog>
    );
};

const renderProperty = (
    p: CyclingModeProperty,
    settings: Settings,
    onChange: (key: string, value: any) => void
) => {
    const value = settings[p.key] ?? p.default;

    switch (p.type) {
        case CyclingModeProperyType.Integer:
            return (
                <EditNumber
                    key={p.key}
                    label={p.name}
                    value={value}
                    min={p.min}
                    max={p.max}
                    digits={0}
                    onValueChange={(v) => onChange(p.key, v)}
                />
            );
        case CyclingModeProperyType.Float:
            return (
                <EditNumber
                    key={p.key}
                    label={p.name}
                    value={value}
                    min={p.min}
                    max={p.max}
                    digits={2}
                    onValueChange={(v) => onChange(p.key, v)}
                />
            );
        case CyclingModeProperyType.String:
            return (
                <EditText
                    key={p.key}
                    label={p.name}
                    value={value}
                    onValueChange={(v) => onChange(p.key, v)}
                />
            );
        case CyclingModeProperyType.Boolean:
            return (
                <ChipSelect
                    key={p.key}
                    label={p.name}
                    options={['Yes', 'No']}
                    selected={value ? 'Yes' : 'No'}
                    onValueChange={(v) => onChange(p.key, v === 'Yes')}
                />
            );
        case CyclingModeProperyType.SingleSelect: {
            const selectOptions = (p.options ?? []).map((o) =>
                typeof o === 'string' ? o : o.label ?? o.key ?? o.toString()
            );
            return (
                <SingleSelect
                    key={p.key}
                    label={p.name}
                    options={selectOptions}
                    selected={value}
                    onValueChange={(v) => onChange(p.key, v)}
                />
            );
        }
        case CyclingModeProperyType.MultiSelect: {
            const chipOptions = (p.options ?? []).map((o) =>
                typeof o === 'string' ? o : o.label ?? o.key ?? o.toString()
            );
            return (
                <ChipSelect
                    key={p.key}
                    label={p.name}
                    options={chipOptions}
                    selected={value}
                    onValueChange={(v) => onChange(p.key, v)}
                />
            );
        }
        default:
            return null;
    }
};

const styles = StyleSheet.create({});