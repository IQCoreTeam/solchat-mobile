import { AppView } from '@/components/app-view'
import { AppText } from '@/components/app-text'
import { PublicKey } from '@solana/web3.js'
import { useWalletUi } from '@/components/solana/use-wallet-ui'
import React from 'react'
import { TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRequestAirdrop } from '@/components/account/use-request-airdrop'

export function AccountFeatureAirdrop({ back }: { back: () => void }) {
  const { account } = useWalletUi()
  const amount = 1
  const requestAirdrop = useRequestAirdrop({ address: account?.publicKey as PublicKey })

  const handleAirdrop = () => {
    requestAirdrop
      .mutateAsync(amount)
      .then(() => {
        console.log(`Requested airdrop of ${amount} SOL to ${account?.publicKey}`)
        back()
      })
      .catch((err) => console.log(`Error requesting airdrop: ${err}`, err))
  }

  return (
    <AppView>
      <AppText type="subtitle">Request a 1 SOL airdrop to the connected wallet.</AppText>

      <TouchableOpacity
        disabled={requestAirdrop.isPending}
        onPress={handleAirdrop}
        style={{
          marginTop: 16,
          borderRadius: 2,
          backgroundColor: '#15f016',
          paddingVertical: 8,
          paddingHorizontal: 16,
          alignItems: 'center',
          opacity: requestAirdrop.isPending ? 0.6 : 1,
        }}
      >
        {requestAirdrop.isPending ? (
          <ActivityIndicator color="#000" />
        ) : (
          <AppText type="defaultSemiBold" style={{ color: '#000000' ,}}>
            Request Airdrop
          </AppText>
        )}
      </TouchableOpacity>

      {requestAirdrop.isError && (
        <AppText style={{ color: 'red', fontSize: 12, marginTop: 8 ,}}>
          {requestAirdrop.error.message}
        </AppText>
      )}
    </AppView>
  )
}
