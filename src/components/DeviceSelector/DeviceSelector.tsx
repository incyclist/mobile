import React, { FC, useState } from 'react';
import { View, Text,  StyleSheet, ScrollView, useWindowDimensions, Switch, Platform } from 'react-native';
import DeviceEntry from '../DeviceEntry';
import { DeviceSelectionItemProps, DeviceSelectionProps } from 'incyclist-services';
import { colors, textSizes } from '../../theme';
import { Dialog } from '../Dialog';

export const DeviceSelector: FC<DeviceSelectionProps> = ({
  devices,
  isScanning,
  disabled,
  changeForAll,
  canSelectAll,
  onClose,
}) => {

    const { width: screenWidth, height:screenHeight } = useWindowDimensions();

    const targetWidth = textSizes.listEntry * 0.6 * 40 /*characters */; // ~288dp
    const minHeightLeft = screenHeight- ( textSizes.dialogTitle+100/* Footer*/+80 +8/*padding */) ; 

    const [all,setAll] = useState<boolean>(canSelectAll && changeForAll)
    const [none,setNone] = useState<boolean>(disabled)

    const styles = StyleSheet.create({
    dialog: {
        width: Math.min(0.9*screenWidth, targetWidth)
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        minWidth: Math.min(screenWidth * 0.9, targetWidth)
    },
    modalView: {
        width: 'auto', // Width depends on content
    },
    header: {
        padding: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#553388',
    },
    headerText: {
        fontSize: textSizes.dialogTitle,
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    deviceList: {
        flex:1,
        maxHeight: 380,
        minHeight: Math.min(380, minHeightLeft)
    },
    footer: {
        flexDirection:'row',
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#553388',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight:4
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    checkmark: {
        color: '#fff',
        fontSize: 14,
    },
    footerText: {
        color: '#fff',
    },
    });

    const onForAllClicked = ()=> {
        setAll( (current)=> {
            return !current
        })

    }

    const onNoneClicked= ()=>{
        setNone( (current)=> {
            return !current
        })

    }

    const onDeviceClicked = (device:DeviceSelectionItemProps) => {
        if (device.onClick)
            device.onClick(all)
        
    }

    const onDialogClosed = () => {
        onClose( none===false)
    }





  return (
        

    <Dialog style={styles.dialog} title={isScanning ? 'Searching ...' : 'Select Device'} onOutsideClick={onDialogClosed} >
        <View style={styles.modalView}>
            <ScrollView style={styles.deviceList}>
                {devices.map((device) => (
                <DeviceEntry key={`${device.deviceName}-${device.interface}`} {...device} disabled={none}  onClick={()=>onDeviceClicked(device)}/>
                ))}
            </ScrollView>

            <View style={styles.footer}>
                {canSelectAll && (
                    <View style={styles.checkboxContainer}>
                        <Switch value={all}  onValueChange={onForAllClicked}  
                            ios_backgroundColor={colors.switchThumb.off}
                            trackColor={colors.switchTrack} 
                            thumbColor={ all ? colors.switchThumb.on : colors.switchThumb.off}  
                            {...Platform.select({
                                web: {
                                    activeThumbColor: colors.switchThumb.on,
                                    activeTrackColor: colors.switchTrack.true,
                                }
                            })}                            
                            />
                            
                            
                        <Text style={styles.footerText}>For all capabilities</Text>
                    </View>
                )}

                <View style={styles.checkboxContainer}>
                    <Switch value={none}  onValueChange={onNoneClicked}  
                        ios_backgroundColor={colors.switchThumb.off}
                        trackColor={colors.switchTrack} 
                        thumbColor={ all ? colors.switchThumb.on : colors.switchThumb.off}  
                        {...Platform.select({
                            web: {
                                activeThumbColor: colors.switchThumb.on,
                                activeTrackColor: colors.switchTrack.true,
                            }
                        })}                            
                        />
                        
                        
                    <Text style={styles.footerText}>None</Text>
                </View>

            </View>
        </View>
    </Dialog>
      
  );



};


