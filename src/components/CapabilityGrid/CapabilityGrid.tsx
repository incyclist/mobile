import React, { useState } from 'react'
import { View, StyleSheet, LayoutChangeEvent, DimensionValue } from 'react-native'
import { CapabilityTile } from '../CapabilityTile'
import {CapabilityDisplayProps} from 'incyclist-services'

interface CapabilityGridProps {
    capabilities?: {
        top: Array<CapabilityDisplayProps>,
        bottom:Array<CapabilityDisplayProps>
    } 
    compact:boolean 
}


const GAP = 10;
const ASPECT_RATIO = 1.25;
const MAX_TILE_HEIGHT = 200;

interface Dimensions {
    w:number,
    h:number,
    containerMaxWidth: DimensionValue
}
//export const CapabilityGrid = ({ items = [1, 2, 3, 4, 5, 6] }) => {
export const CapabilityGrid = ({ capabilities  }:CapabilityGridProps) => {

    const [dimensions, setDimensions] = useState<Dimensions>({ w: 0, h: 0, containerMaxWidth:'100%' });
    const top = capabilities?.top??[]
    const bottom = capabilities?.bottom??[]
    const items = [...top, ...bottom]

    const onLayout = (event:LayoutChangeEvent) => {
            if (!event?.nativeEvent?.layout)
                return
        const { height } = event.nativeEvent.layout;

        const rawTileH = (height - GAP) / 2;
        const tileH = Math.min(rawTileH, MAX_TILE_HEIGHT);
        const tileW = tileH * ASPECT_RATIO;
            // 3. Max container width = (3 tiles) + (2 gaps)
        const containerMaxWidth = (tileW * 3) + (GAP * 2);
        setDimensions({ w: tileW, h: tileH,containerMaxWidth });
    };

    if (!capabilities)
        return null


    return (
        <View 
            style={styles.container}            
            onLayout={onLayout}>

            <View 
                style={[styles.grid, { maxWidth: dimensions.containerMaxWidth }]}>

            {dimensions.h > 0 && items.map((tile, index) => {

                const { capability, }  = tile

                return (
                    <View 
                    key={index} 
                    style={[styles.tile,{
                        width: dimensions.w,
                        height: dimensions.h,
                        marginRight: (index + 1) % 3 === 0 ? 0 : GAP, // Gap logic for 3 per row
                    }]} 
                    >
                    <CapabilityTile  key={capability}  {...tile} height={dimensions.h} />

                    </View>
                )
            })}

            </View>
        </View>
    );
};




const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center', // Centers the grid if 3 tiles are narrower than screen
    alignContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center', // Centers the grid if 3 tiles are narrower than screen
    alignContent: 'center',
  },
  tile: {
    backgroundColor: '#3498db',
    marginBottom: GAP,
    borderRadius: 8
  }

});

