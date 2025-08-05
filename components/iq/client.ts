import { config, initConfig } from './config';
import {_translate_transaction} from "./transaction";
import {Keypair} from "@solana/web3.js";

import bs58 from 'bs58';
const iqHost = config.iqHost;

export async function getDBPDA(userKey: string): Promise<string> {
    try {
        const response = await fetch(`${iqHost}/getDBPDA/${userKey}`);
        const data: any = await response.json();

        if (response.ok) {
            return data.DBPDA;
        } else {
            throw new Error(data.error || 'Failed to fetch PDA');
        }
    } catch (error) {
        console.error('Error fetching PDA:', error);
        return "null";
    }
}

export async function getServerPDA(userKey: string, serverId: string): Promise<string> {
    try {
        const response = await fetch(`${iqHost}/get-server-pda/${userKey}/${serverId}`);
        const data: any = await response.json();

        if (response.ok) {
            return data.PDA;
        } else {
            throw new Error(data.error || 'Failed to fetch PDA');
        }
    } catch (error) {
        console.error('Error fetching PDA:', error);
        return "null";
    }
}

export async function createServerInitTransactionOnServer(userKey: string, serverType: string, serverID: string, allowedMerkleRoot: string = "public") {
    const url = iqHost + '/initialize-server';
    try {
        const requestData = {
            userKey: userKey,
            serverType: serverType,
            serverID: serverID,
            allowedMerkleRoot: allowedMerkleRoot,
        };
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
        });
        if (response.ok) {
            try {
                const data: any = await response.json();
                return await _translate_transaction(data.transaction);
            } catch (error) {
                console.error('Error creating transaction:', error);
                return null;
            }
        }
    } catch (error) {
        console.error('Error creating initTransactionOnServer:', error);
        return null;
    }
}

export async function createInitTransactionOnServer(userKeyString: string) {
    try {
        const response = await fetch(iqHost + `/initialize-user/${userKeyString}`);
        if (response.ok) {
            try {

                const responseData = await response.json();
                const data: any = responseData;
                const tx = await _translate_transaction(data.transaction)
                return tx;
            } catch (error) {
                console.error('Error creating transaction:', error);
                return null;
            }
        }
    } catch (error) {
        console.error('Error creating initTransactionOnServer:', error);
        return null;
    }
}

//fetch for upload
export async function createCodeInTransactionOnServer(code: string, before_tx: string, method: number, decode_break: number) {
    const url = iqHost + '/create-send-transaction';
    await initConfig();
    const keypair = config.keypair;
    if (!keypair) throw new Error("keypair not initialized");

    const userKey = keypair.publicKey;
    const userKeyString = userKey.toString();

    const requestData = {
        userKeyString,
        code,
        before_tx,
        method,
        decode_break,
    };
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            throw new Error(`Error: ${response}`);
        }
        const data: any = await response.json();

        return await _translate_transaction(data.transaction);

    } catch (error) {
        console.error("Failed to create transaction:", error);
        throw error;
    }
}

export async function createDbCodeTransactionOnserver(handle: string, tail_tx: string, type: string, offset: string) {
    const url = iqHost + '/create-db-code-transaction';
    await initConfig();
    const keypair = config.keypair;
    if (!keypair) throw new Error("keypair not initialized");

    const userKey = keypair.publicKey;
    const userKeyString = userKey.toString();

    const requestData = {
        userKeyString,
        handle,
        tail_tx,
        type,
        offset
    };
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }
        const data: any = await response.json();
        return _translate_transaction(data.transaction);

    } catch (error) {
        console.error("Failed to create transaction:", error);
        throw error;
    }
}

export async function createDbPingTransactionToWalletOnServer(pingWalletAddressString: string, pingAmount: number, handle: string, tail_tx: string, type: string, offset: string) {
    const url = iqHost + '/create-db-ping-transaction-to-wallet';
    await initConfig();
    const keypair = config.keypair;
    if (!keypair) throw new Error("keypair not initialized");

    const userKey = keypair.publicKey;
    const userKeyString = userKey.toString();

    const requestData = {
        userKeyString: userKeyString,
        pingWalletString: pingWalletAddressString,
        pingAmount: pingAmount,
        handle: handle,
        tail_tx: tail_tx,
        type: type,
        offset: offset
    };
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }
        const data: any = await response.json();
        return _translate_transaction(data.transaction);

    } catch (error) {
        console.error("Failed to create transaction:", error);
        throw error;
    }
}

export async function createDbPingTransactionToPDAOnServer(pingPdaString: string, pingAmount: number, handle: string, tail_tx: string, type: string, offset: string) {
    const url = iqHost + '/create-db-ping-transaction-to-pda';
    await initConfig();
    const keypair = config.keypair;
    if (!keypair) throw new Error("keypair not initialized");

    const userKey = keypair.publicKey;
    const userKeyString = userKey.toString();

    const requestData = {
        userKeyString: userKeyString,
        pingPdaString: pingPdaString,
        pingAmount: pingAmount,
        handle: handle,
        tail_tx: tail_tx,
        type: type,
        offset: offset
    };
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }
        const data: any = await response.json();
        return _translate_transaction(data.transaction);

    } catch (error) {
        console.error("Failed to create transaction:", error);
        throw error;
    }
}

export async function makeMerkleRootFromServer(dataList: Array<string>) {
    const url = iqHost + "/generate-merkle-root";
    const requestData = {
        data: dataList,
    };
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const data: any = await response.json();

        return data.merkleRoot;

    } catch (error) {
        console.error("Failed to get Merkle Root:", error);
        throw error;
    }
}

//read functions
export async function fetchChunksUntilComplete(txId: string) {
    let allChunks = [];
    let currentTx = txId;
    let i = 0;
    while (true) {
        console.log("progress:", i);
        i++;
        const url = `${iqHost}/get_transaction_chunks/${currentTx}`; //read transaction by 100 tx read
        const response = await fetch(url);

        const data: any = await response.json();

        const chars = data.resultStr;
        allChunks.push(chars);
        currentTx = data.beforeTx;

        if (!currentTx||currentTx === "Genesis") break;
    }
    const resultReverse = allChunks.reverse();
    const result = resultReverse.join("");
    return {result};
}

export async function getCacheFromServer(txId: string, merkleRoot: string) {
    const url = `${iqHost}/getCache?txId=${encodeURIComponent(txId)}&merkleRoot=${encodeURIComponent(merkleRoot)}`;
    try {
        const response = await fetch(url);
        if (response.ok) {
            return await response.text();
        } else {
            console.error('Error fetching cache data:', response.statusText);
            return "null";
        }
    } catch (error) {
        console.error('Request failed:', error);
        return "null";
    }
}

export async function putCacheToServer(chunk: string[], merkleRoot: string) {
    const url = `${iqHost}/putCache`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({chunks: chunk, merkleRoot}),
        });

        const result = await response.text();
        return result;
    } catch (error) {
        console.error("Failed to send cache:", error);
        return null;
    }
}

export async function getTransactionInfoOnServer(txId: string) {
    try {
        const response = await fetch(iqHost + `/get_transaction_info/${txId}`);
        if (response.ok) {
            try {
                const data: any = await response.json();
                return data.argData;
            } catch (error) {
                console.error('Error creating transaction:', error);
                return null;
            }
        }
    } catch (error) {
        console.error('Error creating initTransactionOnServer:', error);
        return null;
    }
}

export async function getTransactionDataFromBlockchainOnServer(
  txId: string,
  maxRetries: number = 5,
  delayMs: number = 2000,
): Promise<string | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(iqHost + `/get_transaction_result/${txId}`);
      if (response.ok) {
        const text = await response.text();
        // Backend sometimes returns error string even with 200 status when data is not yet available
        if (!text.includes('Error fetching data from blockchain')) {
          return text;
        }
        console.warn(`[getTransactionDataFromBlockchainOnServer] Attempt ${attempt}: backend returned placeholder error, retrying...`);
      } else {
        console.warn(`[getTransactionDataFromBlockchainOnServer] Attempt ${attempt}: HTTP ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`[getTransactionDataFromBlockchainOnServer] Attempt ${attempt} failed:`, error);
    }

    if (attempt < maxRetries) {
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
  console.error(`[getTransactionDataFromBlockchainOnServer] All ${maxRetries + 1} attempts failed for tx ${txId}`);
  return null;
}