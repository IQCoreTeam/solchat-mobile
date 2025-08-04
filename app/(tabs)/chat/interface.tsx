export interface HistoryItem {
    id: string;
    input?: string;
    output?: string;
    type?: string;
    pda?: string;
    joinPrompt?: string;
    timestamp?: number;
  }
export interface CommandResult {
    type?:string;
    output?: string;
    clear?: boolean;
    pda?: string;
    joined?: boolean;
    created?: boolean;
    nickname?: string;
    serverMessageColor?: string; 
    password?:string;
    amount?:string;
    isLeavingChat?: boolean;
    joinPrompt?: string; 
    transactionId?: string; 
}