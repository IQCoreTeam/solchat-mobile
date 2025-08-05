
import IQ from '@/components/iq';
import { useIQWallet } from '@/components/solana/use-iq-wallet';
import { useEffect, useState } from 'react';

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

  const [isUserInitialized, setIsUserInitialized] = useState<boolean | null>(null);

  // Initialize user PDA on wallet connect and log progress
  useEffect(() => {
    if (publicKey) {
      IQ.userInit()
        .then(pda => {
          setIsUserInitialized(true);
          if (pda) {
            console.log('[useWalletUi] userInit: existing PDA found ->', pda);
          } else {
            console.log('[useWalletUi] userInit: PDA did not exist, transaction sent to create it');
          }
        })
        .catch(err => {
          setIsUserInitialized(false);
          if("prior credit" in err.toString()) {
            console.log('[useWalletUi] userInit: wallet not initialized. Not enough SOL in wallet.')

          }
          else {
            console.log('[useWalletUi] userInit: unknown error: ', err)
          }
        });
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
    isUserInitialized,
  }
}
