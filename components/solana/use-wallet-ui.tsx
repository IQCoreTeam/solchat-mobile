
import { useIQWallet } from '@/components/solana/use-iq-wallet';

export function useWalletUi() {
  const {
    publicKey,
    account,
    isAuthenticated,
    connect,
    disconnect,
    signMessage,
    signAndSendTransaction,
  } = useIQWallet()


  
  return {
    publicKey,
    account,
    isAuthenticated,
    connect,
    disconnect,
    signMessage,
    signAndSendTransaction,
  }
}
