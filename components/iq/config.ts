import { Keypair } from '@solana/web3.js';
import { getAppKeypair } from '@/components/account/app-keypair-manager';

export const config = {
  rpc: "https://devnet.helius-rpc.com/?api-key=ab1858fe-4f28-46e6-b2c8-5fe8119f9852",
  iqHost: "https://iq-testbackend-381334931214.asia-northeast3.run.app",
  keypair: null as Keypair | null,
  transactionSizeLimit: 900,
  sizeLimitForSplitCompression: 10000,
};

export async function initConfig() {
  config.keypair = await getAppKeypair();
}
