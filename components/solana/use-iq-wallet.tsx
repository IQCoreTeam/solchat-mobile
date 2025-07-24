import { useAuth } from '@/components/auth/auth-provider'
import { getAppKeypair } from '@/components/account/app-keypair-manager'
import { useConnection } from '@/components/solana/solana-provider'

import {
  Connection,
  Transaction,
  VersionedTransaction,
  PublicKey,
  SendOptions,
} from '@solana/web3.js'
import nacl from 'tweetnacl'


export function useIQWallet() {
     const connection = useConnection();
  const { publicKey, signIn, signOut, isAuthenticated } = useAuth()

  const signMessage = async (message: Uint8Array): Promise<Uint8Array> => {
    const keypair = await getAppKeypair()
    if (!keypair) throw new Error('No wallet found')
    return nacl.sign.detached(message, keypair.secretKey)
  }

  const signAndSendTransaction = async (
    tx: Transaction | VersionedTransaction,
    minContextSlot?: number
  ): Promise<string> => {
    const keypair = await getAppKeypair()
    if (!keypair) throw new Error('No wallet found')

    // Handle legacy Transaction
    if (tx instanceof Transaction) {
      const { blockhash } = await connection.getLatestBlockhash()
      tx.recentBlockhash = blockhash
      tx.feePayer = keypair.publicKey
      tx.sign(keypair)
      const raw = tx.serialize()
      return await connection.sendRawTransaction(raw, {
        minContextSlot,
      } satisfies SendOptions)
    }

    // Handle VersionedTransaction (already constructed + signed externally)
    const raw = tx.serialize()
    return await connection.sendRawTransaction(raw, {
      minContextSlot,
    } satisfies SendOptions)
  }

  return {
    account: publicKey ? { publicKey } : null,
    publicKey,
    isAuthenticated,
    connect: signIn,
    disconnect: signOut,
    signMessage,
    signAndSendTransaction,
  }
}
