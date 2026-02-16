import React, { PropsWithChildren  } from 'react';
import { DialogProps } from './types';
import LinearGradient from 'react-native-linear-gradient'
import { 
    View, 
    Text, 
    StyleSheet, 
    Modal, 
    TouchableWithoutFeedback, 
    Platform,
    ScrollView
} from 'react-native';
import { ButtonBar } from '../ButtonBar';
import { colors, textSizes } from '../../theme';

export const Dialog = ({ 
    title, 
    style,
    width, height,
    buttons, 
    children,
    visible=true, 
    onOutsideClick 
}: PropsWithChildren<DialogProps>) => {



    const styles = getStyles({width,height})
    
    const gradientColors = colors.dialogBackground;

    // Mock behavior for Web/Storybook Vite
    const BackgroundContainer = Platform.OS === 'web' ? View : LinearGradient;
    const backgroundStyle = Platform.OS === 'web' 
        ? [styles.container, { backgroundColor: gradientColors[gradientColors.length-1] }] 
        : styles.container;

    return (
        
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onOutsideClick}
        >
            <TouchableWithoutFeedback onPress={onOutsideClick}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <BackgroundContainer 
                            colors={gradientColors} 
                            style={[backgroundStyle,style]}
                        >
                        
                                <View style={styles.header}>
                                    <Text style={styles.title}>{title}</Text>
                                </View>
                                
                                <ScrollView 
                                    style={styles.scrollArea}
                                    contentContainerStyle={styles.content}
                                    bounces={false}
                                >
                                    {children}
                                </ScrollView>                                


                                {buttons?.length  ? (
                                    <View style={styles.footer}>
                                        <ButtonBar buttons={buttons} />
                                    </View>
                                ): <></>}
                        
                        </BackgroundContainer>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};



type StyleProps = {
    width: number|undefined,
    height: number|undefined
}

const getStyles = ({width,height}:StyleProps) => StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        //width: '90%',        
        width,
        height,
        maxHeight: '80%',
        borderRadius: 8,
        overflow: 'hidden',
        color:colors.text
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.dialogBorder ?? '#ccc',
    },
    title: {
        fontSize: textSizes.dialogTitle,
        fontWeight: 'bold',
        color: colors.text,
    },
    scrollArea: {
        // flexShrink allows the scrollview to give up space for header/footer
        flexShrink: 1,
        
    },    
    content: {
        flexGrow: 1,
        padding: 2,
        color:colors.text,
        
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: colors.dialogBorder ?? '#ccc',
    },
});