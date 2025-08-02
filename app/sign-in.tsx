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
import { transact, Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js'


export default function SignIn() {
  const { signIn, isLoading } = useAuth()

  const handleSignIn = async () => {
    const existingKeypair = await getAppKeypair()

    // If a local keypair already exists, proceed as before
    if (existingKeypair) {
      await signIn()
      router.replace('/')
      return
    }

    // Otherwise prompt user to pick a wallet provider via Mobile Wallet Adapter
    try {
      await transact(async (wallet: Web3MobileWallet) => {
        await wallet.authorize({
          chain: 'solana:devnet', // change to 'mainnet-beta' in production
          identity: {
            name: AppConfig.name,
            uri: 'https://solchat.app',
            icon: 'favicon.ico',
          },
        })
      })

      // After successful authorization, continue with current signIn flow (creates local wallet for now)
      await signIn()
      router.replace('/')
    } catch (e: any) {
      // User cancelled or no wallet available
      Alert.alert(
        'Wallet Connection',
        'Unable to connect to a wallet provider. Please ensure a compatible wallet (e.g., Phantom) is installed.',
        [{ text: 'OK', style: 'default' }]
      )
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
