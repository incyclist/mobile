import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors } from '../../theme'

import {CapabilityDisplayProps, TIncyclistCapability} from 'incyclist-services'

interface CapabilityTileProps extends CapabilityDisplayProps {
    height: number
    
}

export const CapabilityTile = ({      
        capability,
        header,
        deviceName,
        connectState,
        value,
        unit,
        height,
        
        onClick
     }: CapabilityTileProps) => {


    
    const isEmpty = !deviceName
    const backgroundColor = isEmpty ?  colors.tileEmpty : colors.tileActive

    const onPress = ()=>{
        if (onClick)
            onClick(capability)
    }

    if ( deviceName) {
        return (
            <TouchableOpacity
                style={[styles.tile, { height, backgroundColor}]}
                onPress={onPress}
            >

            {/* {data.header.icon &&
                <Image source={iconMap[data.header.icon]} style={styles.icon} /> } */}
            {header.title &&
                <Text style={styles.title}>{header.title.toUpperCase()}</Text> }

            {!!deviceName && <Text style={styles.device}>{deviceName}</Text>}

            {!!value && (
                <Text style={styles.value}>
                {value} {unit}
                </Text>
            )}

            <View style={styles.footer}>
                <Text style={styles.state}>
                {connectState?.toUpperCase()}
                </Text>
            </View>
            </TouchableOpacity>
    )


    }

    
    return (
        <TouchableOpacity
            style={[styles.tile, { height, backgroundColor}]}
            onPress={onPress}
        >

        {/* {data.header.icon &&
            <Image source={iconMap[data.header.icon]} style={styles.icon} /> } */}
        {header.title &&
            <Text style={styles.title}>{header.title.toUpperCase()}</Text> }

        <View style={styles.empty}>
            <Text style={styles.emptyText}>
            Click to search
            </Text>
        </View>

        </TouchableOpacity>
  )
}

// const iconMap:Record<TDisplayCapability,any> = {
//   power: require('../assets/icons/power.png'),
//   resistance: require('../assets/icons/resistance.png'),
//   cadence: require('../assets/icons/cadence.png'),
//   heartrate: require('../assets/icons/heartrate.png'),
// }

const styles = StyleSheet.create({
  tile: {
    aspectRatio:1,
    marginBottom: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
  },
  active: { backgroundColor: colors.tileActive },
  idle: { backgroundColor: colors.tileIdle },
  icon: { width: 48, height: 48, tintColor: '#fff' },
  device: { color: '#fff', fontSize: 12 },
  title: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: '700' 
  },
  value: { color: '#fff', fontSize: 16, fontWeight: '700' },
  empty: {
    
    textAlign:'center',
    verticalAlign:'middle',
    justifyContent:'center'
  },
  emptyText: { color: '#fff', fontSize: 10 },
  footer: {
    width: '100%',
    backgroundColor: '#000',
    alignItems: 'center',
    paddingVertical: 0,
  },
  state: { color: '#fff', fontSize: 10 },
})
