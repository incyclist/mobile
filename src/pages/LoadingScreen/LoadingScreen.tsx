import { ActivityIndicator, Image, StatusBar, StyleSheet, Text, useColorScheme, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { NavigationBar } from '@zoontek/react-native-navigation-bar';

interface LoadingScreenProps  {
    appVersion: string
    bundleVersion: string
    statusMessage?: string
}
export const LoadingScreen = ( {appVersion, bundleVersion, statusMessage}:LoadingScreenProps)=> {
    const isDarkMode = useColorScheme() === 'dark';

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar hidden={true} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <NavigationBar hidden={true} />

            <View style={styles.content}>
                <Image
                source={require('../../assets/logo.png')} 
                style={styles.logo} 
                resizeMode="contain"
                />
                {appVersion && <Text style={styles.versionText}>App Version {appVersion}</Text>}
                {bundleVersion && <Text style={styles.versionText}>UI Version {bundleVersion}</Text>}
                {statusMessage && <Text style={styles.versionText}>{statusMessage}</Text>}
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 3,
  },
});