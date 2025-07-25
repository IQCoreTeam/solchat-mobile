import { useRouter } from 'expo-router'
import { View, TouchableOpacity } from 'react-native'
import { AppText } from '@/components/app-text'

export function AccountUiButtons() {
  const router = useRouter()
  return (
    <View style={{ flexDirection: 'row', gap: 4, justifyContent: 'center' }}>
      <TouchableOpacity
        onPress={() => router.navigate('/(tabs)/account/airdrop')}
        style={{ borderRadius: 2, backgroundColor: '#01df1e', padding: 8 }}
      >
        <AppText type="defaultSemiBold" style={{ color: '#000000' }}>Airdrop</AppText>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.navigate('/(tabs)/account/send')}
        style={{ borderRadius: 2, backgroundColor: '#01df1e', padding: 8 }}
      >
        <AppText type="defaultSemiBold" style={{ color: '#000000' }}>Send</AppText>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.navigate('/(tabs)/account/receive')}
        style={{ borderRadius: 2, backgroundColor: '#01df1e', padding: 8 }}
      >
        <AppText type="defaultSemiBold" style={{ color: '#000000' }}>Receive</AppText>
      </TouchableOpacity>
    </View>
  )
}
