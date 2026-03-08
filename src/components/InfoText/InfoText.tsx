import React, { useState, useRef, useEffect } from 'react';
import { useLogging, useUnmountEffect } from '../../hooks';
import { InfoTextView } from './InfoTextView';
import { InfotextDisplayProps } from './types';

const getLines = (text: string): string[] => {
    const lines: string[] = [];
    text.split('<br>').forEach(segment => {
        segment.split('\n').forEach(line => lines.push(line));
    });
    return lines.filter(l => l.length > 0);
};

export const InfoText = (props: InfotextDisplayProps) => {
    const { text, routeDistance, timeout } = props;
    const [visible, setVisible] = useState<boolean>(false);
    const { logEvent } = useLogging('InfoText');

    const refTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const refText = useRef<string | undefined>(undefined);
    const refDistance = useRef<number | undefined>(undefined);

    useEffect(() => {
        const clearTimer = () => {
            if (refTimer.current) {
                clearTimeout(refTimer.current);
                refTimer.current = null;
            }
        };

        // Service explicitly cleared the text — hide immediately, no logging
        if (!text) {
            clearTimer();
            refText.current = undefined;
            setVisible(false);
            return;
        }

        // New text or new position — reset and show
        if (text !== refText.current || routeDistance !== refDistance.current) {
            clearTimer();
            refText.current = text;
            refDistance.current = routeDistance;
            setVisible(true);
            logEvent({ message: 'Infotext shown', text, routeDistance });

            refTimer.current = setTimeout(() => {
                logEvent({ message: 'Infotext closed' });
                setVisible(false);
                refTimer.current = null;
            }, timeout ?? 5000);
        }
    }, [text, routeDistance, timeout, logEvent]);

    useUnmountEffect(() => {
        if (refTimer.current) {
            clearTimeout(refTimer.current);
            refTimer.current = null;
        }
    });

    if (!visible || !text) {
        return null;
    }

    const lines = getLines(text);
    const textAlign = lines.length < 2 ? 'center' : 'left';

    return <InfoTextView lines={lines} textAlign={textAlign} />;
};
