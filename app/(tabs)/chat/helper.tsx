import { Connection, PublicKey } from "@solana/web3.js";

export const pdaCheck = async (connection: Connection,PDA: string) => {

    try {
      const PDAPubkey = new PublicKey(PDA);
  
      return await connection.getAccountInfo(PDAPubkey);
    } catch (error) {
      console.error("PDA Check failed:", error);
      return null;
    }
  };