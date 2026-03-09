import React from 'react';
import { navigate } from '../../services';
import { VideoDemoView } from './View';
import type { TNavigationItem } from '../../components';

export const VideoDemoPage = () => {
    const onClick = (item: TNavigationItem) => {
        navigate(item);
    };
    return <VideoDemoView onClick={onClick} />;
};
