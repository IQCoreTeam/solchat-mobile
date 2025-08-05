import { AppView } from '@/components/app-view'
import { AppText } from '@/components/app-text'
import { PublicKey } from '@solana/web3.js'
import { useWalletUi } from '@/components/solana/use-wallet-ui'
import React from 'react'
import { TouchableOpacity, ActivityIndicator ,Text,View} from 'react-native'
import { useRequestAirdrop } from '@/components/account/use-request-airdrop'
import {computer} from "@/assets/ascii"

export function AccountFeatureAirdrop({ back }: { back: () => void }) {
  const { account ,publicKey} = useWalletUi()
  const address = publicKey?.toString()
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
    <View style={{ backgroundColor: '#0000FF',padding:10}}>
      <Text style={{ color: '#ffffff',fontFamily: 'monospace',textAlign: 'center'}}>Request a 1 SOL to the connected wallet.</Text>
    <Text style={{color: '#0000FF',backgroundColor: '#ffffff',fontFamily: 'monospace',textAlign: 'center',marginTop:10,marginBottom:10}}>{address}</Text>
    </View>

    <Text style={{ fontSize:14, color: '#ffffff',fontFamily: 'monospace',textAlign: 'left'}}>{computer}</Text>

      <TouchableOpacity
        disabled={requestAirdrop.isPending}
        onPress={handleAirdrop}
        style={{
          marginTop: 16,
          borderRadius: 2,
          backgroundColor: '#ffffff',
          paddingVertical: 8,
          paddingHorizontal: 16,
          alignItems: 'center',
          opacity: requestAirdrop.isPending ? 0.6 : 1,
        }}
      >
        {requestAirdrop.isPending ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={{ color: '#000000',fontFamily: 'monospace'}}>
            Request Airdrop
          </Text>
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
