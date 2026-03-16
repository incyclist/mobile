import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
// Assuming you use react-native-svg-transformer or similar
import BleIcon from  '../../assets/icons/ble.svg'; 
import WifiIcon from '../../assets/icons/wifi.svg';

import {InterfaceDisplayState,InterfaceDisplayProps} from 'incyclist-services'
export { InterfaceDisplayProps } from 'incyclist-services'; // Re-export for storybook
import { Wave } from './Wave';

const STATE_COLORS: Record<InterfaceDisplayState, string> = {
  disabled: '#8E8E93',
  scanning: '#FFFFFF',
  idle: '#FFFFFF',
  error: '#FF3B30',
};



export const InterfaceState: React.FC<InterfaceDisplayProps> = ({ name, state, onClick,error }) => {
  const Icon = name === 'ble' ? BleIcon : WifiIcon;
  const color = STATE_COLORS[state];

  return (
    <TouchableOpacity style={styles.container} onPress={onClick}>
      <View style={styles.iconWrapper}>
        {state === 'scanning' && (
          <>
            <Wave delay={0} color={color} />
            <Wave delay={600} color={color} />
            <Wave delay={1200} color={color} />
          </>
        )}
        <Icon width={32} height={32} fill={color} />

      </View>
      {state === 'error' && error && <Text style={styles.errorText}>{error}</Text>}
      {state !== 'error' && state!=='scanning'  && <Text style={styles.errorText}>{state}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  iconWrapper: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: { color: '#FF3B30', fontSize: 11, marginTop: 8, fontWeight: '600' },
});