import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors, textSizes } from '../../theme';
import { useAppState} from 'incyclist-services';
import { NavigationBar, MainBackground, TNavigationItem } from '../../components';
import { useScreenLayout } from '../../hooks/render/useScreenLayout';

interface PageTransitionProps {
    selected: TNavigationItem;
}

export const PageTransitionView = ({ selected }: PageTransitionProps) => {
    const layout = useScreenLayout();
    const isCompact = layout === 'compact';
    
    return (
        <MainBackground>
            <View style={[styles.layout, isCompact && styles.layoutCompact]}>
                <View style={[styles.navColumn, isCompact && styles.navColumnCompact]}>
                    <NavigationBar selected={selected} disabled={true} onClick={()=>{}} compact={isCompact} />
                </View>
                
                <View style={styles.content}>
                    <ActivityIndicator size="large" color="white" />
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
    container: {
        flex: 1,
    },
    content: {
        ...StyleSheet.absoluteFill,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
    },
    message: {
        color: colors.text,
        fontSize: textSizes.noDataText,
    },
});

export const PageTransition = () => {
    const appState = useAppState();
    const sourcePage = appState.getPersistedState('page')
    const selected = sourcePage.startsWith('/') ? sourcePage.substring(1) : sourcePage;

    return <PageTransitionView selected={selected!} />;
};
