import { View, Text, StyleSheet, Dimensions } from 'react-native'

import { colors } from '../../theme'

import type { PairingDisplayProps } from 'incyclist-services'
import { ButtonBar, CapabilityGrid, ExitButton, MainBackground } from '../../components'

const { height } = Dimensions.get('window')
const compact = height < 420


export const PairingPageView = (props:PairingDisplayProps)=> {
    
  return (
    <View style={styles.container}>
        <MainBackground>
            <View style={styles.rowTitle}>
                <Text style={styles.title}>{props.title?.toUpperCase()}</Text>
            </View>

            <View style={styles.rowFlex}>
            {/* <InterfaceInfo interfaces={props.interfaces} /> */}

            <CapabilityGrid capabilities={props.capabilities} compact={compact} />

            </View>
            <View style={styles.rowButtons}>
            {props.buttons && <ButtonBar buttons={props.buttons} />}
            </View>
            {props.showExit && <ExitButton onExit={props.onExit}/>}

        </MainBackground>
    </View>
  )
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  rowTitle:{
    marginVertical: 5,
  },
  rowButtons:{
    
  },
  rowFlex:{
    flex: 1, // Takes up all available space
    justifyContent: 'center',
    alignItems: 'center',

  },
  title: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginVertical: 0,

  },
})
