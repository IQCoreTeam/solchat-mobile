import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  PropsWithChildren,
} from 'react'
import {
  getAppKeypair,
  setAppWallet,
} from '@/components/account/app-keypair-manager'
import EncryptedStorage from 'react-native-encrypted-storage'
import { PublicKey } from '@solana/web3.js'

export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  publicKey: PublicKey | null
  signIn: () => Promise<PublicKey>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}

const deleteAppWallet = async () => {
  await EncryptedStorage.removeItem('app_wallet_secret_key')
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasWallet, setHasWallet] = useState(false)
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null)

  useEffect(() => {
    (async () => {
      const wallet = await getAppKeypair()
      if (wallet) {
        setHasWallet(true)
        setPublicKey(wallet.publicKey)
      }
      setIsLoading(false)
    })()
  }, [])

  const value: AuthState = useMemo(() => ({
    isAuthenticated: hasWallet,
    isLoading,
    publicKey,
    signIn: async () => {
      const existing = await getAppKeypair()
      if (!existing) {
        await setAppWallet()
      }
      const keypair = await getAppKeypair()
      setHasWallet(true)
      setPublicKey(keypair!.publicKey)
      return keypair!.publicKey
    },
    signOut: async () => {
      await deleteAppWallet()
      setHasWallet(false)
      setPublicKey(null)
    },
  }), [hasWallet, isLoading, publicKey])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
