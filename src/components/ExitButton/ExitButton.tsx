import React from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'

export type OnExitHandler = ()=>void

export interface ExitButtonProps {
    onExit?: OnExitHandler
}

export const ExitButton = ({ onExit}: ExitButtonProps) => (
    
  <TouchableOpacity style={styles.exit} onPress={onExit}>
    <Text style={styles.text}>Exit</Text>
  </TouchableOpacity>
)

const styles = StyleSheet.create({
  exit: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  text: {
    color: '#fff',
    fontSize: 14,
  },
})
