import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { EventEmitter } from 'events';
import { NavigationBar, MainBackground, ElevationGraph, RiderMarker } from '../../components';
import { colors, textSizes } from '../../theme';
import { useUnmountEffect } from '../../hooks';
import type { TNavigationItem } from '../../components';

// Import route data
import teideRoute from '../../../__tests__/testdata/ES_Teide.json';
import sydneyRoute from '../../../__tests__/testdata/sydney.json';

interface MainPageViewProps {
    onClick: (item: TNavigationItem) => void;
}

export const MainPageView = ({ onClick }: MainPageViewProps) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [speedKmh, setSpeedKmh] = useState(30);
    const [currentPos, setCurrentPos] = useState(0);
    const [lapMode, setLapMode] = useState(true);

    const refObserver = useRef<EventEmitter | null>(null);
    const refInitialized = useRef(false);
    const refPos = useRef(0);

    // Initialize observer once
    if (!refObserver.current) {
        refObserver.current = new EventEmitter();
    }

    const totalDistTeide = (teideRoute as any).distance;
    const totalDistSydney = (sydneyRoute as any).distance;

    const emitPosition = useCallback((pos: number) => {
        refPos.current = pos;
        setCurrentPos(pos);
        refObserver.current?.emit('position-update', pos);
    }, []);

    // Simulation Ticker
    useEffect(() => {
        if (!isPlaying) return;

        const interval = setInterval(() => {
            const deltaMeters = (speedKmh / 3.6) * 0.5; // speed in m/s * 0.5s tick
            let nextPos = refPos.current + deltaMeters;

            if (lapMode) {
                // For the test panel, we use sydneyRoute as the wrap reference
                if (nextPos > totalDistSydney) nextPos %= totalDistSydney;
            } else {
                if (nextPos > totalDistTeide) {
                    nextPos = totalDistTeide;
                    setIsPlaying(false);
                }
            }
            emitPosition(nextPos);
        }, 500);

        return () => clearInterval(interval);
    }, [isPlaying, speedKmh, lapMode, totalDistSydney, totalDistTeide, emitPosition]);

    useUnmountEffect(() => {
        refObserver.current?.removeAllListeners();
        refInitialized.current = false;
    });

    const handleReset = () => {
        emitPosition(0);
        setIsPlaying(false);
    };

    const sydneyMarkers: RiderMarker[] = [
        { position: 5000, avatar: { shirt: '#ff4444' } },
        { position: 15000, avatar: { shirt: '#4444ff' } },
    ];

    return (
        <MainBackground>
            <View style={styles.layout}>
                <View style={styles.navColumn}>
                    <NavigationBar position="left" onClick={onClick} />
                </View>

                <ScrollView style={styles.contentColumn} contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.pageTitle}>Elevation Graph Simulation</Text>

                    {/* Controls */}
                    <View style={styles.controlsRow}>
                        <TouchableOpacity
                            style={[styles.button, isPlaying && styles.buttonActive]}
                            onPress={() => setIsPlaying(!isPlaying)}
                        >
                            <Text style={styles.buttonText}>{isPlaying ? 'Pause' : 'Play'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.button} onPress={handleReset}>
                            <Text style={styles.buttonText}>Reset</Text>
                        </TouchableOpacity>

                        <View style={styles.speedGroup}>
                            {[10, 20, 30, 40].map((s) => (
                                <TouchableOpacity
                                    key={s}
                                    style={[styles.speedBtn, speedKmh === s && styles.speedBtnActive]}
                                    onPress={() => setSpeedKmh(s)}
                                >
                                    <Text style={styles.speedText}>{s}</Text>
                                </TouchableOpacity>
                            ))}
                            <Text style={styles.unitText}>km/h</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, lapMode && styles.buttonActive]}
                            onPress={() => setLapMode(!lapMode)}
                        >
                            <Text style={styles.buttonText}>Lap: {lapMode ? 'ON' : 'OFF'}</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.statusText}>Position: {currentPos.toFixed(1)}m</Text>

                    {/* Graphs */}
                    <View style={styles.graphSection}>
                        <Text style={styles.label}>List Preview (Teide, no axes/colors)</Text>
                        <View style={{ height: 50 }}>
                            <ElevationGraph
                                routeData={teideRoute as any}
                                showLine={false}
                                showColors={false}
                                showXAxis={false}
                                showYAxis={false}
                                observer={refObserver.current as any}
                            />
                        </View>
                    </View>

                    <View style={styles.graphSection}>
                        <Text style={styles.label}>Route Detail (Teide, colors/X axis)</Text>
                        <View style={{ height: 160 }}>
                            <ElevationGraph
                                routeData={teideRoute as any}
                                showLine={true}
                                showColors={true}
                                showXAxis={true}
                                showYAxis={false}
                                observer={refObserver.current as any}
                            />
                        </View>
                    </View>

                    <View style={styles.graphSection}>
                        <Text style={styles.label}>2km Preview (Sydney Loop, both axes)</Text>
                        <View style={{ height: 140 }}>
                            <ElevationGraph
                                routeData={sydneyRoute as any}
                                showLine={true}
                                showColors={true}
                                showXAxis={true}
                                showYAxis={true}
                                range={2000}
                                lapMode={true}
                                observer={refObserver.current as any}
                                windowUpdateInterval={5000}
                                minElevationRange={50}
                            />
                        </View>
                    </View>

                    <View style={styles.graphSection}>
                        <Text style={styles.label}>Full Route (Sydney, Lap Mode, Group Markers)</Text>
                        <View style={{ height: 100 }}>
                            <ElevationGraph
                                routeData={sydneyRoute as any}
                                showLine={true}
                                showColors={true}
                                showXAxis={false}
                                showYAxis={false}
                                lapMode={lapMode}
                                markers={sydneyMarkers}
                                currentAvatar={{ shirt: '#dd9933' }}
                                observer={refObserver.current as any}
                                minElevationRange={50}
                            />
                        </View>
                    </View>
                </ScrollView>
            </View>
        </MainBackground>
    );
};

const styles = StyleSheet.create({
    layout: {
        flex: 1,
        flexDirection: 'row',
    },
    navColumn: {
        width: 150,
    },
    contentColumn: {
        flex: 1,
        padding: 20,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    pageTitle: {
        color: colors.text,
        fontSize: textSizes.pageTitle,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
    },
    button: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 4,
        minWidth: 80,
        alignItems: 'center',
    },
    buttonActive: {
        backgroundColor: colors.buttonPrimary,
    },
    buttonText: {
        color: colors.text,
        fontWeight: 'bold',
    },
    speedGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 4,
        padding: 4,
        gap: 4,
    },
    speedBtn: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 2,
    },
    speedBtnActive: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    speedText: {
        color: colors.text,
        fontSize: 12,
    },
    unitText: {
        color: colors.disabled,
        fontSize: 10,
        marginLeft: 4,
    },
    statusText: {
        color: colors.buttonPrimary,
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 20,
    },
    graphSection: {
        marginBottom: 30,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: 10,
    },
    label: {
        color: colors.disabled,
        fontSize: 12,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
