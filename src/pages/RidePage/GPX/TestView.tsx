import React, { useState, useEffect, useRef } from 'react';
import { IObserver } from 'incyclist-services';
import { GPXTourPageView, GPXTourPageViewProps } from './View';
import { MOCK_ROUTE_POINTS } from './GPXTourPage.stories';

/**
 * A wrapper component for Storybook that provides a mock IObserver to simulate
 * dynamic position updates for the GPXTourPageView.
 */
export const TestView = (props: Omit<GPXTourPageViewProps, 'rideObserver'>) => {
    const [, setMockPositionIndex] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const eventHandlers = useRef<Record<string, ((data: any) => void)[]>>({});

    // Create a stable mock observer instance
    const mockObserver = useRef<IObserver>({
        on: (event: string, handler: (data: any) => void) => {
            if (!eventHandlers.current[event]) {
                eventHandlers.current[event] = [];
            }
            eventHandlers.current[event].push(handler);

            if (event === 'position-update' && !intervalRef.current) {
                // Start emitting position updates when the first position-update handler is registered
                intervalRef.current = setInterval(() => {
                    setMockPositionIndex(prevIndex => {
                        const nextIndex = (prevIndex + 1) % MOCK_ROUTE_POINTS.length;
                        // Emit to all registered handlers for 'position-update'
                        eventHandlers.current['position-update']?.forEach(h =>
                            h({ position: MOCK_ROUTE_POINTS[nextIndex] })
                        );
                        return nextIndex;
                    });
                }, 1000); // Update every 1 second
            }
        },
        off: (event: string, handler: (data: any) => void) => {
            if (eventHandlers.current[event]) {
                eventHandlers.current[event] = eventHandlers.current[event].filter(h => h !== handler);
            }
            // If no more position-update listeners, clear the interval
            if (event === 'position-update' && eventHandlers.current['position-update']?.length === 0 && intervalRef.current) {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
                intervalRef.current = null;
            }
        },
        // Minimal no-op implementations for other IObserver methods
        emit: () => {},
        once: () => {},
        removeAllListeners: () => {},
        listeners: () => [],
        listenerCount: () => 0,
    }).current;

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    return <GPXTourPageView {...props} rideObserver={mockObserver} />;
};