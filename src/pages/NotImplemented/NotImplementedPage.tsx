import { StyleSheet, Text, View } from "react-native";
import { colors, textSizes } from "../../theme";
import { useIncyclist } from "incyclist-services";
import { NavigationBar, MainBackground, TNavigationItem } from '../../components';
import { getUIBinding } from "../../bindings/ui";
import { navigate } from "../../services";

interface NotImplementedViewProps {
    onClick:( item:TNavigationItem)=>void,
    selected:TNavigationItem
}

export const NotImplementedView = ( {onClick,selected}:NotImplementedViewProps) => {
    
    return (
        <MainBackground>
            <View style={styles.layout}>
                <View style={styles.navColumn}>
                    <NavigationBar selected={selected} onClick={onClick} />
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
    navColumn: {
        width: 150,
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

export const NotImplementedPage= ( {selected}:{selected?:TNavigationItem}) => {
    const incyclist = useIncyclist()

    const onClick=( item:TNavigationItem)=> {
        if (item==='exit') {
            incyclist.onAppExit()
                .then( ()=>{ getUIBinding().quit()})
        }
        else 
            navigate(item)
    }
    return <NotImplementedView selected={selected!} onClick={onClick}/>
}