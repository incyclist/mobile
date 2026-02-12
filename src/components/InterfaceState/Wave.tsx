import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

export const Wave = ({ delay, color }: { delay: number; color: string }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;

    const startAnimation = () => {
      if (!isMounted) return;

      // Force reset to 0 before starting each wave
      anim.setValue(0);
      
      Animated.timing(anim, {
        toValue: 1,
        duration: 3000, // Total time for one wave to travel
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        // Recursively restart to ensure it loops forever
        if (finished && isMounted) {
          startAnimation();
        }
      });
    };

    // Apply the staggered start delay only once at the beginning
    const timeout = setTimeout(startAnimation, delay);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      anim.stopAnimation();
    };
  }, [anim, delay]);

  const animatedStyle = {
    opacity: anim.interpolate({
      inputRange: [0, 0.2, 0.8, 1],
      outputRange: [0, 0.5, 0.2, 0], // Fades in, stays visible, then fades out
    }),
    transform: [{
      scale: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.8, 4], // Expands significantly
      }),
    }],
    borderColor: color,
  };

  return <Animated.View style={[styles.wave, animatedStyle]} />;
};

const styles = StyleSheet.create({
  wave: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 20,
    borderWidth: 1,
  }  
});