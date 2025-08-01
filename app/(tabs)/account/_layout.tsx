import { WalletUiDropdown } from '@/components/solana/wallet-ui-dropdown'
import { AppText } from '@/components/app-text'

import { Stack } from 'expo-router'

export default function Layout() {
  return (
    <Stack
         screenOptions={{
           headerTitle: () => <AppText type="subtitle">Account</AppText>,
           headerRight: () => <WalletUiDropdown />
         }}
       >
      <Stack.Screen name="index" />

      <Stack.Screen name="airdrop" options={{ headerTitle: 'Airdrop', headerTintColor: '#15f016',  headerTitleStyle: { fontFamily: 'MinecraftStandardBold' ,color: "#15f016"}, headerRight: () => null }} />
      <Stack.Screen name="send" options={{ headerTitle: 'Send', headerTintColor: '#15f016',  headerTitleStyle: { fontFamily: 'MinecraftStandardBold' ,color: "#15f016"}, headerRight: () => null }} />
      <Stack.Screen name="receive" options={{ headerTitle: 'Receive', headerTintColor: '#15f016',  headerTitleStyle: { fontFamily: 'MinecraftStandardBold' ,color: "#15f016"}, headerRight: () => null }} />
    </Stack>
  )
}
