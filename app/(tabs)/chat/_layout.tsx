import { WalletUiDropdown } from '@/components/solana/wallet-ui-dropdown'
import { AppText } from '@/components/app-text'

import { Stack } from 'expo-router'
import React from 'react'

export default function SettingsLayout() {
  return (
      <Stack
         screenOptions={{
           headerTitle: () => <AppText type="subtitle">Chat</AppText>,
           headerRight: () => <WalletUiDropdown />,
         }}
       >
      <Stack.Screen name="index" />
    </Stack>
  )
}
