import { AppView } from '@/components/app-view'
import { AppText } from '@/components/app-text'
import { PublicKey } from '@solana/web3.js'
import { TouchableOpacity } from 'react-native';

import { AppQrCode } from '@/components/app-qr-code'
import { Button } from '@react-navigation/elements'
import Clipboard from '@react-native-clipboard/clipboard'
 const buttonStyle = {
    borderRadius: 2,
    backgroundColor: '#15f016',
    paddingVertical: 8,
    paddingHorizontal: 16,
  };

  const textStyle = {
    color: '#000000',
  };

export function AccountFeatureReceive({ address }: { address: PublicKey }) {
  return (
    <AppView style={{ gap: 16 }}>
      <AppText type="subtitle">Send assets to this address:</AppText>
      <AppView style={{ alignItems: 'center', gap: 16, }}>
        <AppText type="defaultSemiBold" style={{ textAlign: 'center'  , borderColor:"#15f016",  borderWidth: 1,borderRadius: 3,borderStyle: 'dashed', }}>
          {address.toString()}
        </AppText>
         <TouchableOpacity onPress={() => Clipboard.setString(address.toString())} style={buttonStyle}>
                <AppText type="defaultSemiBold" style={textStyle}>Copy Address</AppText>
              </TouchableOpacity>
        <AppQrCode value={address.toString()} />
      </AppView>
    </AppView>
  )
}
