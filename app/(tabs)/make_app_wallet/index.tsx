import React from 'react'
import { AppPage } from '@/components/app-page'
import { LocalWalletKeypairFeature } from '@/components/account/keypair-feature'

export default function TabsDemoScreen() {
  return (
    <AppPage>
      <LocalWalletKeypairFeature />
    </AppPage>
  )
}
