import { Connection, type ConnectionConfig } from '@solana/web3.js'
import React, { createContext, type ReactNode, useContext, useMemo } from 'react'
import { useCluster } from '../cluster/cluster-provider'
import Constants from 'expo-constants';

const rpcUrl = Constants.expoConfig?.extra?.RPC_URL;

console.log('RPC URL:', rpcUrl);

export interface SolanaProviderState {
  connection: Connection
}

export interface SolanaProviderProps {
  children: ReactNode
  config?: ConnectionConfig
}

const ConnectionContext = createContext<SolanaProviderState>({} as SolanaProviderState)

export function SolanaProvider({ children, config = { commitment: 'finalized' } }: SolanaProviderProps) {
  const { selectedCluster } = useCluster()
  const RPC_URL = process.env.REACT_APP_RPC_URL;

  const myCluster = rpcUrl || selectedCluster.endpoint || "";
  console.log(myCluster);
  console.log('process.env.REACT_APP_RPC_URL:', rpcUrl);

  const connection = useMemo(() => new Connection(myCluster, config), [myCluster, config])

  return <ConnectionContext.Provider value={{ connection }}>{children}</ConnectionContext.Provider>
}

export function useSolana(): SolanaProviderState {
  return useContext(ConnectionContext)
}

export function useConnection(): Connection {
  return useSolana().connection
}
