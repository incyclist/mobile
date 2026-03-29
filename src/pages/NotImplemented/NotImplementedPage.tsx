import { StyleSheet, Text, View } from 'react-native';
import { colors, textSizes } from '../../theme';
import { useIncyclist } from 'incyclist-services';
import { NavigationBar, MainBackground, TNavigationItem } from '../../components';
import { getUIBinding } from '../../bindings/ui';
import { navigate } from '../../services';
import { useScreenLayout } from '../../hooks/render/useScreenLayout';

interface NotImplementedViewProps {
    onClick: (item: TNavigationItem) => void;
    selected: TNavigationItem;
}

export const NotImplementedView = ({ onClick, selected }: NotImplementedViewProps) => {
    const layout = useScreenLayout();
    const isCompact = layout === 'compact';
    
    return (
        <MainBackground>
            <View style={[styles.layout, isCompact && styles.layoutCompact]}>
                <View style={[styles.navColumn, isCompact && styles.navColumnCompact]}>
                    <NavigationBar selected={selected} onClick={onClick} compact={isCompact} />
                </View>
                
                <View style={styles.content}>
                    <Text style={styles.message}>Not yet implemented</Text>
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

export const NotImplementedPage = ({ selected }: { selected?: TNavigationItem }) => {
    const incyclist = useIncyclist();

    const onClick = (item: TNavigationItem) => {
        if (item === 'exit') {
            incyclist.onAppExit()
                .then(() => { getUIBinding().quit(); });
        }
        else 
            navigate(item);
    };
    return <NotImplementedView selected={selected!} onClick={onClick} />;
};