import { AppText } from '@/components/app-text'
import { AppView } from '@/components/app-view'
import { useAuth } from '@/components/auth/auth-provider'
import { AppConfig } from '@/constants/app-config'
import { ResizeMode, Video } from 'expo-av'
import { router } from 'expo-router'
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { getAppKeypair } from '@/components/account/app-keypair-manager'
import { Colors } from '@/constants/colors'
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
        <SafeAreaView style={{ flex: 1, justifyContent: 'flex-start', paddingTop: 80 }}>
          <View />
          <View style={{ alignItems: 'center', gap: 16, marginTop: 40 }}>
            <AppText type="title">{AppConfig.name}</AppText>
            <Video
              source={require('@/assets/images/cloud-edit-ae.mp4')}
              style={styles.video}
              isLooping
              isMuted
              shouldPlay
              resizeMode={ResizeMode.COVER}
            />
            <AppText style={styles.descriptionText}>
              {'Onchain P2P Messaging\nBuilt by IQ6900\nPowered by Solana'}
            </AppText>
          </View>
          <View style={{ marginTop: 40 }}>
            <View style={[styles.buttonContainer, { marginBottom: 0 }]}>
              <TouchableOpacity
                onPress={handleSignIn}
                style={styles.connectButton}
                activeOpacity={0.8}
              >
                <AppText style={styles.connectButtonText}>Connect</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      )}
    </AppView>
  )
}

const styles = StyleSheet.create({
  video: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: Colors.dark.icon, 
    borderRadius: 4,
  },
  buttonContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  connectButton: {
    backgroundColor: Colors.dark.border,
    borderWidth: 1, 
    borderColor: Colors.dark.icon, 
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitleText: {
    color: Colors.dark.icon,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
    marginBottom: 16,
  },
  descriptionText: {
    color: Colors.dark.icon,
    fontSize: 12,
    marginTop: 8,
    opacity: 0.8,
    textAlign: 'left',
    width: '100%',
    maxWidth: 300,
    marginLeft: 20,
  },
  connectButtonText: {
    color: Colors.dark.background,
    fontSize: 16,
    fontWeight: '600',
  },
})
