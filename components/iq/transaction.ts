import {
    Connection,
    PublicKey,
    Transaction,
    TransactionInstruction,
    sendAndConfirmTransaction
} from "@solana/web3.js";
import { createInitTransactionOnServer, createServerInitTransactionOnServer, getDBPDA, getServerPDA } from "./client";

import { config, initConfig } from "./config";
import { codeIn } from "./uploader";
const network = config.rpc!

export async function serverInit(serverType: string, serverID: string, allowedMerkleRoot: string = "public") {
      await initConfig();
      const keypair = config.keypair;
      if (!keypair) throw new Error("keypair not initialized");

    const userKey = keypair.publicKey;
    const useKeyString = userKey.toString()
    const PDA = await getServerPDA(useKeyString, serverID);

    const isPDAExist = await pdaCheck(PDA);
    if (isPDAExist) {
        console.log("PDA Exist :", PDA);
        return PDA
    }
    const transaction = await createServerInitTransactionOnServer(useKeyString, serverType, serverID, allowedMerkleRoot);
    if (transaction != null) {
        await txSend(transaction)
        console.log("Your Server PDA address:", PDA);
        return PDA;
    } else {
        console.error("Transaction build failed");
    }
}

export async function userInit() {
          await initConfig();
          const keypair = config.keypair;
          if (!keypair) throw new Error("keypair not initialized");
    const userKey = keypair.publicKey;
    const useKeyString = userKey.toString()
    const transaction = await createInitTransactionOnServer(useKeyString)
    const PDA = await getDBPDA(useKeyString);

    const isPDAExist = await pdaCheck(PDA);
    if (isPDAExist) {
        console.log("PDA Exist");
        return PDA
    }

    if (transaction != null) {
        await txSend(transaction)

    } else {
        console.error("Transaction build failed");
    }
}

export async function pdaCheck(PDA: string) {
    try {
        const PDAPubkey = new PublicKey(PDA)
        const connection = new Connection(network);

        return await connection.getAccountInfo(PDAPubkey);
    } catch (error) {
        console.error("PDA Check failed:", error);
    }
}

export async function _translate_transaction(data: any) {
    const transaction = new Transaction();
    const connection = new Connection(network);
    const latestBlockhash = await connection.getLatestBlockhash();
    transaction.recentBlockhash = latestBlockhash.blockhash;
    transaction.feePayer = new PublicKey(data.feePayer);

    data.instructions.forEach((instr: any) => {
        const instruction = new TransactionInstruction({
            keys: instr.keys.map((key: any) => ({
                pubkey: new PublicKey(key.pubkey),
                isSigner: key.isSigner,
                isWritable: key.isWritable,
            })),
            programId: new PublicKey(instr.programId),
            data: instr.data,
        });
        transaction.add(instruction);
    });
    return transaction;
}

export async function txSend(tx: Transaction): Promise<string> {
          await initConfig();
          const keypair = config.keypair;
          if (!keypair) throw new Error("keypair not initialized");
    let connection = new Connection(network, 'confirmed');
    let blockHash = await connection.getLatestBlockhash();
    while (blockHash == undefined) {
        connection = new Connection(network, 'confirmed');
        blockHash = await connection.getLatestBlockhash();
    }
    tx.recentBlockhash = blockHash.blockhash;
    tx.lastValidBlockHeight = blockHash.lastValidBlockHeight;
    tx.feePayer = keypair.publicKey;
    tx.sign(keypair);

    const txid = await sendAndConfirmTransaction(connection, tx, [keypair]);
    if (txid == undefined) {
        return "null";
    } else {
        return txid;
    }
}

export async function appTxSend(tx: Transaction, signAndSendTransaction: (tx: Transaction) => Promise<string>): Promise<string> {
    try {
      const connection = new Connection(network, 'confirmed');
      let blockHash = await connection.getLatestBlockhash();
      while (!blockHash) {
        blockHash = await connection.getLatestBlockhash();
      }
      tx.recentBlockhash = blockHash.blockhash;
      tx.lastValidBlockHeight = blockHash.lastValidBlockHeight;
      const txid = await signAndSendTransaction(tx);
      return txid;
    } catch (error) {
      console.error('Transaction send failed:', error);
      return 'null';
    }
};

export async function sendChat(pdaString: string, message: string, handle: string = 'default-handle') {
    try {
      // Inscribe message to PDA and log resulting transaction ID
      const txid = await codeIn(message, "group_chat", handle);
      console.log(`Message sent to PDA ${pdaString}: ${message}`);
      console.log(`[sendChat] Transaction ID: ${txid}`);
      return !!txid;
    } catch (error) {
      console.error('Failed to send chat:', error);
      return false;
    }
  }