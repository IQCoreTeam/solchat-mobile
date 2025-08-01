import { AppView } from '@/components/app-view'
import { AppText } from '@/components/app-text'
import { PublicKey } from '@solana/web3.js'
import { ActivityIndicator, TextInput, View, TouchableOpacity,Text } from 'react-native'
import React, { useState } from 'react'
import { useTransferSol } from '@/components/account/use-transfer-sol'
import { useThemeColor } from '@/hooks/use-theme-color'
import {bow} from "@/assets/ascii"
export function AccountFeatureSend({ address }: { address: PublicKey }) {
  const transferSol = useTransferSol({ address })
  const [destinationAddress, setDestinationAddress] = useState('')
  const [amount, setAmount] = useState('1')

  const backgroundColor = useThemeColor({ light: '#f0f0f0', dark: '#1a1a1a' }, 'background')
  const textColor = useThemeColor({ light: '#15f016', dark: '#15f016' }, 'text')

  const handleSend = () => {
    transferSol
      .mutateAsync({
        amount: parseFloat(amount),
        destination: new PublicKey(destinationAddress),
      })
      .then(() => {
        console.log(`Sent ${amount} SOL to ${destinationAddress}`)
      })
      .catch((err) => console.log(`Error sending SOL: ${err}`, err))
  }

  return (
    <AppView>
      <Text  style={{backgroundColor: '#0000FF',fontSize:15, color: '#ffffff',fontFamily: 'monospace',textAlign: 'center'}}>Send SOL from the connected wallet.</Text>
    <Text style={{ fontSize:14, color: '#ffffff',fontFamily: 'monospace',textAlign: 'left'}}>{bow}</Text>

      {transferSol.isPending ? (
        <ActivityIndicator />
      ) : (
        <View style={{ gap: 16,}}>
         <Text style={{ color: '#15f016',fontFamily: 'monospace',textAlign: 'center'}}>Amount (SOL)</Text>
          <TextInput
            style={{
              backgroundColor,
              color:  '#15f016',
              borderColor:"#15f016",
              borderTopWidth: 1,
              borderBottomWidth: 1,
               borderStyle: 'dashed',
                fontFamily: 'monospace',
              paddingHorizontal: 16,
            }}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />

           <Text style={{ color: '#15f016',fontFamily: 'monospace',textAlign: 'center'}}>Destination Address</Text>
          <TextInput
            style={{
              backgroundColor,
               color:  '#15f016',
               borderColor:"#15f016",
               borderTopWidth: 1,
               borderBottomWidth: 1,
              borderStyle: 'dashed',
               fontFamily: 'monospace',
              paddingHorizontal: 16,
            }}
            value={destinationAddress}
            onChangeText={setDestinationAddress}
          />

          <TouchableOpacity
            disabled={transferSol.isPending}
            onPress={handleSend}
            style={{
              borderRadius: 2,
              backgroundColor: '#ffffff',
              paddingVertical: 8,
              paddingHorizontal: 16,
              alignItems: 'center',
              opacity: transferSol.isPending ? 0.6 : 1,
            }}
          >
            {transferSol.isPending ? (
              <ActivityIndicator color="#000" />
            ) : (
               <Text style={{ color: '#000000',fontFamily: 'monospace'}}>
                Send SOL
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {transferSol.isError && (
        <AppText style={{ color: 'red', fontSize: 12, marginTop: 8, }}>
          {transferSol.error.message}
        </AppText>
      )}
    </AppView>
  )
}
