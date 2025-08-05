import { useRouter } from 'expo-router';
import { View, TouchableOpacity } from 'react-native';
import { AppText } from '@/components/app-text';
import { useCluster } from '@/components/cluster/cluster-provider';
import { ClusterNetwork } from '@/components/cluster/cluster-network';

export function AccountUiButtons() {
  const router = useRouter();
  const { selectedCluster } = useCluster();
  const isMainnet = selectedCluster.network === ClusterNetwork.Mainnet;

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
      {!isMainnet && (
        <TouchableOpacity onPress={() => router.navigate('/(tabs)/account/airdrop')} style={buttonStyle}>
          <AppText type="defaultSemiBold" style={textStyle}>Airdrop</AppText>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => router.navigate('/(tabs)/account/send')} style={buttonStyle}>
        <AppText type="defaultSemiBold" style={textStyle}>Send</AppText>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.navigate('/(tabs)/account/receive')} style={buttonStyle}>
        <AppText type="defaultSemiBold" style={textStyle}>Receive</AppText>
      </TouchableOpacity>
    </View>
  );
}
