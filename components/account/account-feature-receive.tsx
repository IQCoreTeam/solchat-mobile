import { AppView } from '@/components/app-view'
import { AppText } from '@/components/app-text'
import { PublicKey } from '@solana/web3.js'
import { TouchableOpacity ,Text,View} from 'react-native';

import { AppQrCode } from '@/components/app-qr-code'
import { Button } from '@react-navigation/elements'
import Clipboard from '@react-native-clipboard/clipboard'
 const buttonStyle = {
    borderRadius: 2,
    backgroundColor: 'yellow',
  };


export function AccountFeatureReceive({ address }: { address: PublicKey }) {
  return (
    <AppView style={{ gap: 16 }}>
    <Text style={{color: '#0000FF',backgroundColor: '#ffffff',fontFamily: 'monospace',textAlign: 'center',marginTop:10,marginBottom:10}}>Send assets to this address:</Text>
      <AppView style={{ alignItems: 'center', gap: 16, }}>
        <Text style={{ textAlign: 'center' ,color: '#ffffff',fontFamily: 'monospace',}}>
          {address.toString()}
        </Text>
         <TouchableOpacity onPress={() => Clipboard.setString(address.toString())} style={buttonStyle}>
                <Text style={{ textAlign: 'center' ,color: '#0000000',fontFamily: 'monospace',}}>--Copy Address--</Text>
              </TouchableOpacity>
        <AppQrCode value={address.toString()} />
      </AppView>
    </AppView>
  )
}
