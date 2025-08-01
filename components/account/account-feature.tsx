import { useWalletUi } from '@/components/solana/use-wallet-ui'
import { AppText } from '@/components/app-text'
import { ellipsify } from '@/utils/ellipsify'
import { AppView } from '@/components/app-view'
import { AppPage } from '@/components/app-page'
import { AccountUiButtons } from './account-ui-buttons'
import { AccountUiBalance } from '@/components/account/account-ui-balance'
import { RefreshControl, ScrollView,View ,Text} from 'react-native'
import { useCallback, useState } from 'react'
import { useGetBalanceInvalidate } from '@/components/account/use-get-balance'
import { PublicKey } from '@solana/web3.js'
import { useGetTokenAccountsInvalidate } from '@/components/account/use-get-token-accounts'
import { WalletUiButtonConnect } from '@/components/solana/wallet-ui-button-connect'
import {walletFire} from "@/assets/ascii"

export function AccountFeature() {
  const { account } = useWalletUi()
  const [refreshing, setRefreshing] = useState(false)
  const invalidateBalance = useGetBalanceInvalidate({ address: account?.publicKey as PublicKey })
  const invalidateTokenAccounts = useGetTokenAccountsInvalidate({ address: account?.publicKey as PublicKey })
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([invalidateBalance(), invalidateTokenAccounts()])
    setRefreshing(false)
  }, [invalidateBalance, invalidateTokenAccounts])

  return (
    <AppPage>
      {account ? (
        <ScrollView
          contentContainerStyle={{flexGrow: 1,justifyContent: 'center',alignItems: 'center' , paddingBottom: '30%', }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => onRefresh()} />}
        >
       <Text style={{fontFamily:'monospace',textAlign: 'left',fontSize: 16,color: '#00ff00',marginBottom:15}}>
                  {walletFire}
                </Text>
          <AppView style={{ alignItems: 'center', justifyContent:'center', gap: 4,}}>
            <AccountUiBalance address={account.publicKey} />
            <AppText style={{ opacity: 0.7,}}>{ellipsify(account.publicKey.toString(), 8)}</AppText>
          </AppView>
          <AppView style={{ marginTop: 16, alignItems: 'center', }}>
            <AccountUiButtons />
          </AppView>

        </ScrollView>
      ) : (
        <AppView style={{ flexDirection: 'column', justifyContent: 'flex-end', }}>
          <AppText>Connect your wallet.</AppText>
          <WalletUiButtonConnect />
        </AppView>
      )}
    </AppPage>
  )
}
