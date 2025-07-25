import { router } from 'expo-router'
import { useAuth } from '@/components/auth/auth-provider'
import { AppText } from '@/components/app-text'
import { AppView } from '@/components/app-view'
import { AppConfig } from '@/constants/app-config'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ActivityIndicator, View, Alert } from 'react-native'
import { Image } from 'expo-image'
import { Button } from '@react-navigation/elements'
import { getAppKeypair } from '@/components/account/app-keypair-manager'

export default function SignIn() {
  const { signIn, isLoading } = useAuth()

  const handleSignIn = async () => {
    const existingKeypair = await getAppKeypair()

    if (!existingKeypair) {
        //after we can be able to use sdk, we need to put iq init function in some where,
        //since this just make a wallet and not fill the gas, we could display the error when user try to send the data without money
      Alert.alert(
        'Create Wallet',
        'No wallet found. Would you like to create a new wallet?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes',
            onPress: async () => {
              await signIn()
              router.replace('/')
            },
          },
        ],
        { cancelable: true }
      )
    } else {
      await signIn()
      router.replace('/')
    }
  }

  return (
    <AppView style={{ flex: 1, justifyContent: 'center', alignItems: 'stretch' ,}}>
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <SafeAreaView style={{ flex: 1, justifyContent: 'space-between' ,}}>
          <View />
          <View style={{ alignItems: 'center', gap: 16 ,}}>
            <AppText type="title">{AppConfig.name}</AppText>
            <Image source={require('../assets/images/icon.png')} style={{ width: 128, height: 128, }} />
          </View>
          <View style={{ marginBottom: 16, }}>
            <Button
              variant="filled"
              style={{ marginHorizontal: 16, }}
              onPress={handleSignIn}
            >
              Connect
            </Button>
          </View>
        </SafeAreaView>
      )}
    </AppView>
  )
}
