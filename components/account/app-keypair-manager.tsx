import { Keypair } from "@solana/web3.js";
import { getItem, setItem } from "./local-storage";

export const setAppWallet = async () => {
  const keypair = Keypair.generate();
  const serialized = JSON.stringify(Array.from(keypair.secretKey));
  await setItem('app_wallet_secret_key', serialized);
};

export const getAppKeypair = async () => {
  const result = await getItem('app_wallet_secret_key');
  if (result) {
    const secret = JSON.parse(result); // number[]
    return Keypair.fromSecretKey(Uint8Array.from(secret));
  }
  return null;
};
