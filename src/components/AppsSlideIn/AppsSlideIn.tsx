import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Animated,
    TouchableOpacity,
    TouchableWithoutFeedback,
    useWindowDimensions,
    Platform,
    Text,
    Image,
    DimensionValue
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SvgUri } from 'react-native-svg';
import { AppsSlideInProps } from './types';
import { AppDisplayProps } from '../AppsSettings/types';
import { colors, textSizes } from '../../theme';
import { useLogging } from '../../hooks';

const gradientColors = colors.dialogBackground;
const BackgroundContainer = Platform.OS === 'web' ? View : (LinearGradient as any);
const panelBackgroundStyle = Platform.OS === 'web'
    ? { backgroundColor: gradientColors[gradientColors.length - 1] }
    : { flex: 1 };

const AppRow = ({ app, onSelect }: { app: AppDisplayProps; onSelect?: (key: string) => void }) => {
    const isSvg = app.iconUrl.toLowerCase().endsWith('.svg');
    
    const handlePress = useCallback(() => {
        onSelect?.(app.key);
    }, [app.key, onSelect]);

    const badgeStyle = [
        styles.badge,
        { backgroundColor: app.isConnected ? colors.success : colors.disabled }
    ];

    return (
        <TouchableOpacity style={styles.row} onPress={handlePress} activeOpacity={0.7}>
            <View style={styles.leftContainer}>
                <View style={styles.iconWrapper}>
                    {isSvg ? (
                        <SvgUri uri={app.iconUrl} width="100%" height="100%" />
                    ) : (
                        <Image source={{ uri: app.iconUrl }} style={styles.image} />
                    )}
                </View>
                <Text style={styles.appName}>{app.name}</Text>
            </View>
            <View style={styles.rightContainer}>
                <View style={badgeStyle} />
                <Text style={styles.chevron}>›</Text>
            </View>
        </TouchableOpacity>
    );
};

export const AppsSlideIn = ({
    visible,
    apps,
    offsetX,
    onSelect,
    onClose
}: AppsSlideInProps) => {
    const { width: screenWidth } = useWindowDimensions();
    const { logEvent } = useLogging('AppsSlideIn');
    
    const panelWidth = screenWidth * 0.35;
    const animPos = useRef(new Animated.Value(-panelWidth)).current;
    
    const [isAnimating, setIsAnimating] = useState(false);
    const [isFullyClosed, setIsFullyClosed] = useState(!visible);
    const hasMountedRef = useRef(false);

    useEffect(() => {
        if (!hasMountedRef.current) {
            hasMountedRef.current = true;
            if (!visible) {
                return;
            }
        }

        const targetValue = visible ? 0 : -panelWidth;
        
        if (visible) {
            setIsFullyClosed(false);
            logEvent({ message: 'panel shown', dialog: 'AppsSlideIn' });
        }
        setIsAnimating(true);

        Animated.timing(animPos, {
            toValue: targetValue,
            duration: 220,
            useNativeDriver: true,
        }).start(() => {
            setIsAnimating(false);
            if (!visible) {
                setIsFullyClosed(true);
            }
        });
    }, [visible, animPos, panelWidth, logEvent]);

    const handleSelect = (key: string) => {
        logEvent({ message: 'app selected', appKey: key });
        onSelect?.(key);
    };

    if (isFullyClosed && !isAnimating) {
        return null;
    }

    const backdropPointerEvents = visible ? 'auto' : 'none';
    const backdropOpacity = visible ? 1 : 0;

    const dynamicPanelContainerStyle = { 
        left: offsetX,
        width: panelWidth as DimensionValue,
        transform: [{ translateX: animPos }]
    };

    return (
        <View 
            style={StyleSheet.absoluteFill} 
            pointerEvents={visible || isAnimating ? 'box-none' : 'none'}
            testID="apps-slide-in"
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View 
                    style={[styles.backdrop, { opacity: backdropOpacity }]} 
                    pointerEvents={backdropPointerEvents} 
                    testID="apps-backdrop"
                />
            </TouchableWithoutFeedback>

            <Animated.View
                style={[
                    styles.panelContainer,
                    dynamicPanelContainerStyle
                ]}
            >
                <BackgroundContainer
                    colors={gradientColors}
                    style={[panelBackgroundStyle, styles.panel]}
                >
                    <View style={styles.content}>
                        {apps?.map((app) => (
                            <AppRow 
                                key={app.key} 
                                app={app} 
                                onSelect={handleSelect} 
                            />
                        ))}
                    </View>
                </BackgroundContainer>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    panelContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        zIndex: 1100,
    },
    panel: {
        width: '100%',
        height: '100%',
    },
    content: {
        flex: 1,
        paddingTop: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.15)',
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconWrapper: {
        width: 32,
        height: 32,
        marginRight: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: 32,
        height: 32,
        resizeMode: 'contain',
    },
    appName: {
        color: colors.text,
        fontSize: textSizes.listEntry,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badge: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 12,
    },
    chevron: {
        color: colors.text,
        fontSize: textSizes.listEntry,
    },
});