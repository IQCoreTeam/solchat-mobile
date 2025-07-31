
import IQ from '@/components/iq';
import { useIQWallet } from '@/components/solana/use-iq-wallet';
import { useEffect } from 'react';

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

  // Initialize user PDA on wallet connect and log progress
  useEffect(() => {
    if (publicKey) {
      console.log('[useWalletUi] Wallet connected:', publicKey.toString());
      IQ.userInit()
        .then(pda => {
          if (pda) {
            console.log('[useWalletUi] userInit: existing PDA found ->', pda);
          } else {
            console.log('[useWalletUi] userInit: PDA did not exist, transaction sent to create it');
          }
        })
        .catch(err => console.error('[useWalletUi] userInit failed:', err));
    } else {
      console.log('[useWalletUi] Wallet disconnected');
    }
  }, [publicKey]);


  
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
