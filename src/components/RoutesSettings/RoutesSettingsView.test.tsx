import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RoutesSettingsView } from './RoutesSettingsView';
import { ALL_CARDS } from './RoutesSettings.mock';

jest.mock('../Dialog', () => {
    const { View } = require('react-native');
    return { Dialog: ({ children }: any) => <View>{children}</View> };
});

describe('RoutesSettingsView', () => {
    it('renders the cards in the given order without crashing', () => {
        const { getAllByRole } = render(
            <RoutesSettingsView cards={ALL_CARDS} compact={false} onOpenCard={jest.fn()} onClose={jest.fn()} />
        );
        expect(getAllByRole('button')).toHaveLength(2);
    });

    it('reports the card that was pressed', () => {
        const onOpenCard = jest.fn();
        const { getByText } = render(
            <RoutesSettingsView cards={ALL_CARDS} compact={true} onOpenCard={onOpenCard} onClose={jest.fn()} />
        );
        fireEvent.press(getByText('Route Sharing'));
        expect(onOpenCard).toHaveBeenCalledWith('sharing');
    });
});
