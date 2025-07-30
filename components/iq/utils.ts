import {config,initConfig} from "./config";

export async function getMyPublicKey() {
    await initConfig();
    const keypair = config.keypair;
    if (!keypair) throw new Error("keypair not initialized");
    return keypair.publicKey;
}


export async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function naturalSort(files: string[]): string[] {
    return files.sort((a, b) => {
        const aMatch = a.match(/\d+/);
        const bMatch = b.match(/\d+/);

        const aNum = aMatch ? parseInt(aMatch[0], 10) : 0;
        const bNum = bMatch ? parseInt(bMatch[0], 10) : 0;

        return aNum - bNum || a.localeCompare(b);
    });
}

export function isMerkleRoot(str: string) {
    const base58Alphabet = /^[1-9A-HJ-NP-Za-km-z]+$/;
    return base58Alphabet.test(str) && str.length === 44;
}

export async function getChunk(textData: string, chunkSize: number): Promise<string[]> {
    const datalength = textData.length;
    const totalChunks = Math.ceil(datalength / chunkSize);
    let chunks = [];
    for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, datalength);
        chunks.push(textData.slice(start, end));
    }
    if (chunks.length < 1) {
        return ["null"];
    } else {
        return chunks;
    }
}