import { getAppKeypair } from '@/components/account/app-keypair-manager';
import { clusterApiUrl, Keypair, Transaction, VersionedTransaction } from '@solana/web3.js';

export const config = {
  rpc: clusterApiUrl('devnet'),//"https://devnet.helius-rpc.com/?api-key=ab1858fe-4f28-46e6-b2c8-5fe8119f9852",
  iqHost: "https://iq-testbackend-381334931214.asia-northeast3.run.app",
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
