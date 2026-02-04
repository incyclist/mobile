import React, { ReactNode } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';

interface MainBackgroundProps {
  children?: ReactNode;
}

export const MainBackground = ({ children }: MainBackgroundProps) => {
  return (
    <ImageBackground 
      source={require('../../assets/background.jpg')} // Replace with your actual path
      style={styles.background}
      resizeMode="cover"
      blurRadius={8} 
    >
      <View style={styles.overlay}>
        {children}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1, // Ensures the background fills the full screen
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    // Add default padding or alignment here if needed
  },
});
