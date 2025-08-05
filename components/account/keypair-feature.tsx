import React, { useState } from 'react'
import { ActivityIndicator } from 'react-native'
import { Button } from '@react-navigation/elements'
import { AppView } from '@/components/app-view'
import { AppText } from '@/components/app-text'
import { setAppWallet, getAppKeypair } from '@/components/account/app-keypair-manager'

export function LocalWalletKeypairFeature() {
  const [publicKeyText, setPublicKeyText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGetKeypair = async () => {
    setLoading(true)
    const keypair = await getAppKeypair()
    if (keypair) {
      setPublicKeyText(keypair.publicKey.toBase58())
    } else {
      setPublicKeyText('No keypair found')
    }
    setLoading(false)
  }

  const handleSetKeypair = async () => {
    await setAppWallet()
    setPublicKeyText('Keypair generated!')
  }

  return (
    <AppView>
      <AppText type="subtitle">Lets test making a server wallet</AppText>

      <Button onPress={handleSetKeypair} variant="filled">
        setAppWallet
      </Button>

      <Button onPress={handleGetKeypair} variant="filled">
        getAppKeypair
      </Button>

      {loading ? (
        <ActivityIndicator />
      ) : (
        publicKeyText && <AppText>{publicKeyText}</AppText>
      )}
    </AppView>
  )
}