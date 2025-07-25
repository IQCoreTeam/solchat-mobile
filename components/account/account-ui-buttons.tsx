import { useRouter } from 'expo-router'
import { View } from 'react-native'
import { AppText } from '@/components/app-text'

import { Button } from '@react-navigation/elements'

export function AccountUiButtons() {
  const router = useRouter()
  return (
    <View style={{ flexDirection: 'row', gap: 4, justifyContent: 'center' }}>
      <Button onPressIn={() => router.navigate('/(tabs)/account/airdrop')}  style={{borderRadius:2 , backgroundColor:"#01df1e"}}><AppText type="defaultSemiBold" style={{color:"#000000"}}>Airdrop</AppText></Button>
      <Button onPressIn={() => router.navigate('/(tabs)/account/send')}  style={{borderRadius:2 ,backgroundColor:"#01df1e"}}><AppText type="defaultSemiBold" style={{color:"#000000"}}>Send</AppText></Button>
      <Button onPressIn={() => router.navigate('/(tabs)/account/receive')} style={{borderRadius:2 ,backgroundColor:"#01df1e"}}><AppText type="defaultSemiBold" style={{color:"#000000"}}>Receive</AppText></Button>
    </View>
  )
}
