import React from 'react';
import { navigate } from '../../services';
import { RidePageView } from './View';
import type { TNavigationItem } from '../../components';

export const RidePage = () => {
    const onClick = (item: TNavigationItem) => {
        navigate(item);
    };
    return <RidePageView onClick={onClick} />;
};
