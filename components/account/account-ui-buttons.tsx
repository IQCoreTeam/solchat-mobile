import { useRouter } from 'expo-router';
import { View, TouchableOpacity } from 'react-native';
import { AppText } from '@/components/app-text';

export function AccountUiButtons() {
  const router = useRouter();

  const buttonStyle = {
    borderRadius: 2,
    backgroundColor: '#15f016',
    paddingVertical: 8,
    paddingHorizontal: 16,
  };

  const textStyle = {
    color: '#000000',
  };

  return (
    <View style={{ flexDirection: 'row', gap: 4, justifyContent: 'center' }}>
      <TouchableOpacity onPress={() => router.navigate('/(tabs)/account/airdrop')} style={buttonStyle}>
        <AppText type="defaultSemiBold" style={textStyle}>Airdrop</AppText>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.navigate('/(tabs)/account/send')} style={buttonStyle}>
        <AppText type="defaultSemiBold" style={textStyle}>Send</AppText>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.navigate('/(tabs)/account/receive')} style={buttonStyle}>
        <AppText type="defaultSemiBold" style={textStyle}>Receive</AppText>
      </TouchableOpacity>
    </View>
  );
}
