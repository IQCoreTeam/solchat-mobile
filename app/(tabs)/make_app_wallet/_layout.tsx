import { WalletUiDropdown } from '@/components/solana/wallet-ui-dropdown'

import { Stack } from 'expo-router'
import React from 'react'

export default function makeAppWalletLayout() {
  return (
    <Stack screenOptions={{ headerTitle: 'make_app_wallet', headerRight: () => <WalletUiDropdown /> }}>
      <Stack.Screen name="index" />
    </Stack>
  )
}
