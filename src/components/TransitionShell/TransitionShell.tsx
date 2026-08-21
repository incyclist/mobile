import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationBar } from '../NavigationBar';
import { MainBackground } from '../MainBackground';
import { useScreenLayout } from '../../hooks/render/useScreenLayout';
import { TransitionShellProps } from './types';

const noop = () => {};

/**
 * Nav sidebar + centered content shell shared by `PageTransitionView` and `NotImplementedView` -
 * extracted from a byte-identical copy in both (FIXES_BACKLOG.md item #63 - SonarCloud
 * duplication). Each caller supplies its own centered content (an `ActivityIndicator` vs a
 * "Not yet implemented" message) and, for `NotImplementedView`, a real nav `onClick` handler.
 */
export const TransitionShell = ({ selected, onClick, disabled, children }: TransitionShellProps) => {
    const layout = useScreenLayout();
    const isCompact = layout === 'compact';

    return (
        <MainBackground>
            <View style={[styles.layout, isCompact && styles.layoutCompact]}>
                <View style={[styles.navColumn, isCompact && styles.navColumnCompact]}>
                    <NavigationBar
                        selected={selected}
                        onClick={onClick ?? noop}
                        disabled={disabled}
                        compact={isCompact}
                    />
                </View>

                <View style={styles.content}>
                    {children}
                </View>
            </View>
        </MainBackground>
    );
};

const styles = StyleSheet.create({
    layout: {
        flex: 1,
        flexDirection: 'row',
    },
    layoutCompact: {
        flexDirection: 'column',
    },
    navColumn: {
        width: 150,
    },
    navColumnCompact: {
        width: '100%',
        height: 56,
    },
    content: {
        ...StyleSheet.absoluteFill,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
    },
});
