import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from '@solana/web3.js';
import {
  getOrCreateAssociatedTokenAccount,
  getAccount,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

import { getAppKeypair } from '@/components/account/app-keypair-manager'

const BONK_MINT = new PublicKey('3jV8jHCeqkgfK4Y7hSNbt4dCM3aFG3Rp7LkyqRYJWfRJ');

export async function sendBonk(connection: Connection,amount: number, recipientAddress: string) {
  try {
    const recipient = new PublicKey(recipientAddress);
    const keypair = await getAppKeypair();
    if (!keypair) {
      throw new Error('Keypair could not be loaded.');
    }
    const senderAta = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      BONK_MINT,
      keypair.publicKey
    );

    const senderTokenAccount = await getAccount(connection, senderAta.address);
    const decimals = 9;
    const multiplier = Math.pow(10, decimals);

    if (Number(senderTokenAccount.amount) < amount * multiplier) {
        const userBalance = Number(senderTokenAccount.amount) / multiplier;
      console.log(`Check your balance to send: ${amount} your balance: ${userBalance}`);
      return;
    }


    const recipientAta = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      BONK_MINT,
      recipient
    );

    const tx = new Transaction().add(
      createTransferInstruction(
        senderAta.address,
        recipientAta.address,
        keypair.publicKey,
        amount * multiplier,
        [],
        TOKEN_PROGRAM_ID
      )
    );

    const sig = await sendAndConfirmTransaction(connection, tx, [keypair]);
    console.log('Send success! TX:', sig);
  } catch (err) {
    console.error('Error:', err);
  }
}
