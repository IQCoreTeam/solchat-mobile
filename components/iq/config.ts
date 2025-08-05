import { getAppKeypair } from '@/components/account/app-keypair-manager';
import { clusterApiUrl, Keypair, Transaction, VersionedTransaction } from '@solana/web3.js';
import Constants from 'expo-constants';

const IQ_BACKEND_HOST = Constants.expoConfig?.extra?.IQ_BACKEND_HOST;
console.log('IQ_BACKEND_HOST:', IQ_BACKEND_HOST);

const RPC_URL = Constants.expoConfig?.extra?.RPC_URL;
console.log('RPC_URL:', RPC_URL);

export const config = {
  rpc: RPC_URL,
  iqHost: IQ_BACKEND_HOST || 'https://iq-testbackend-381334931214.asia-northeast3.run.app',
  keypair: null as Keypair | null,
  transactionSizeLimit: 900,
  sizeLimitForSplitCompression: 10000,
  signAndSendTransaction: undefined as
  | ((tx: Transaction | VersionedTransaction, minContextSlot?: number) => Promise<string>)
  | undefined,
};

export async function initConfig() {
  config.keypair = await getAppKeypair();
}
