import React from 'react'
import { View, StyleSheet, useWindowDimensions } from 'react-native'
import { CapabilityTile } from '../CapabilityTile'
import {CapabilityDisplayProps, TIncyclistCapability} from 'incyclist-services'

interface CapabilityGridProps {
    capabilities?: {
        top: Array<CapabilityDisplayProps>,
        bottom:Array<CapabilityDisplayProps>
    } 
    compact:boolean 
}
export const CapabilityGrid = ({ capabilities  }:CapabilityGridProps) => {
    const { height,width } = useWindowDimensions()

    if (!capabilities) return null

    const {top=[],bottom=[]} = capabilities
    // Rough vertical budget (empirically stable)
    const GRID_HEIGHT = height * 0.55
    const TILE_HEIGHT = GRID_HEIGHT / 2 - 12

    const marginHorizontal = 0.3 * width

  return (
    <View style={[styles.grid, {marginHorizontal, height:GRID_HEIGHT }]}>
      {top.map(tile => (

        <CapabilityTile key={tile.capability} {...tile} height={TILE_HEIGHT} />
      ))}
      {bottom.map(tile => (
        <CapabilityTile key={tile.capability} {...tile} height={TILE_HEIGHT} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    flex:3,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    
  },
})
