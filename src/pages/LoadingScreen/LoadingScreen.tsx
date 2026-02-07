import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

interface LoadingScreenProps  {
    version: string
}
export const LoadingScreen = ( {version}:LoadingScreenProps)=> {

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Image
                source={require('../../assets/logo.png')} 
                style={styles.logo} 
                resizeMode="contain"
                />
                <Text style={styles.versionText}>Version {version}</Text>
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
    marginBottom: 30,
  },
});

