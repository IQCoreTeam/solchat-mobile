import { AppPage } from '@/components/app-page';
import { AppText } from '@/components/app-text';
import { useWalletUi } from '@/components/solana/use-wallet-ui';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import Clipboard from '@react-native-clipboard/clipboard';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, TextInput, TouchableOpacity, View } from 'react-native';
import styles from './styles';

// Define your network (e.g., 'devnet', 'mainnet-beta', or a custom RPC URL)
const NETWORK = clusterApiUrl('mainnet-beta');  // Adjust as needed
const WELCOME_MESSAGE = `Welcome to Solchat!\n[1] Create or search chat server\n[2] Enter chat room\nType your selection:`;

const pdaCheck = async (PDA: string) => {
  try {
    const PDAPubkey = new PublicKey(PDA);
    const connection = new Connection(NETWORK);

    return await connection.getAccountInfo(PDAPubkey);
  } catch (error) {
    console.error("PDA Check failed:", error);
    return null;  // Or throw error, depending on your needs
  }
};

// TypeScript interface for history items
interface HistoryItem {
  id: string;
  input?: string;
  output?: string;
}



// Simple test API call
const handleChatServerAction = async (serverId: string| null, pubkey: string | null): Promise<string> => {
  try {
    // valid wallet
    // A1BK8kJqG2o1uScbLjApMXBNzWGjoNjtpjaCkGQkdkY6
    // valid pda
    // BHcXCRmnPWNz31UUJEhe8W46seNrDH6ZysHyug5XNmCd
    console.log(`DEBUG: in handleChatServerAction`)
    console.log(`DEBUG: serverId : ${serverId}`)
    console.log(`DEBUG: pubkey : ${pubkey}`)

    //const pubkeyFromSdk = await IQ.getMyPublicKey();
    //await IQ.userInit();
    //await IQ.codeIn("Hello World", "app-test", "example-handle");
    //console.log(`DEBUG: pubkeyFromSdk : ${pubkeyFromSdk}`)
    const iqHost = "https://iq-testbackend-381334931214.asia-northeast3.run.app"


    const response = await fetch(`${iqHost}/get-server-pda/AbSAnMiSJXv6LLNzs7NMMaJjmexttg5NpQbCfXvGwq1F/${serverId}`);

    console.log(`DEBUG: response body : ${response.body}`)
    console.log(`DEBUG: response status : ${response.status}`)
    
    console.log(`DEBUG: response : ${response}`)
    if (!response.ok) {
      if (response.status === 500) {
        return `Error: PDA not found`;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`DEBUG: data : ${data}`)
    if (data && data.PDA) {
      console.log(`Fetched PDA: ${data.PDA}`);
      const pdaCheckResult = await pdaCheck(data.PDA);
      console.log(`DEBUG: pdaCheckResult : ${pdaCheckResult}`)
      if (pdaCheckResult) {
        console.log(`PDA found: ${pdaCheckResult}`);  
        return `Server exists.\nPDA: ${data.PDA}\n\nJoin server? [y/n]`;
      }
      else {
        console.log(`PDA not found. Would you like to create a new server?`);  
        return `PDA not found. Would you like to create a new server?`;
      }
    } else {
      return 'Error: could not find PDA from backend service';
    }
  } catch (error) {
    console.error('API call failed:', error);
    return `API Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
  }
};

// Handle joining a chat server
const handleJoinChatServer = async (): Promise<string> => {
  return 'Joining server...';
};

// Command processing logic
const processCommand = async (command: string, pubkey: string | null, phase: string): Promise<{ output?: string; clear?: boolean }> => {
  const cmd = command.trim().toLowerCase();

  if (cmd === '') return {};
  // Handle ongoing phases first
  if (phase === 'waitingForServerId') {
  // Use this input as serverId and complete the action
  const actionOutput = await handleChatServerAction(cmd, pubkey);  // cmd is the serverId
  if (actionOutput.startsWith('Error:') || actionOutput.startsWith('API Error:')) {
    // Append prompt after error
    return { output: `${actionOutput}\nType your selection:` };
  }
return { output: actionOutput };
} 

  if (phase === 'waitingForJoinResponse') {
    if (cmd === 'y' || cmd === 'yes') {
      const joinOutput = await handleJoinChatServer();
      return { output: joinOutput };
    } else if (cmd === 'n' || cmd === 'no') {
      return { 
        output: [WELCOME_MESSAGE].join('\n')
      };
    } else {
      return { output: 'Please enter y or n:' };
    }
  } 
  switch (cmd) {
    case 'clear':
      return { clear: true };
    case 'help':
      return {
        output: [
          'Available commands:',
          '1 - Create or search chat server',
          '2 - Enter chat room',
          'clear - Clear screen',
          'help - Show this message',
        ].join('\n'),
      };
    case '1':
      return { output: 'Enter Server ID:' };  

    case '2':
      return { output: 'Entering chat room... (not yet implemented)' };
      //TODO: make the error message when user do any on-chain action without the gas fee.
    default:
      if (cmd.startsWith('echo ')) {
        return { output: cmd.slice(5) };
      }
      return { output: `Command not found: ${command}` };
  }
};


// Component to render command history
const CommandHistory: React.FC<{
  history: HistoryItem[];
  flatListRef: React.RefObject<FlatList<HistoryItem> | null>;
}> = ({ history, flatListRef }) => {
  // Copy all history (inputs and outputs) to clipboard
  const handleCopyAll = () => {
    const text = history
      .map(item => [item.input, item.output].filter(Boolean).join('\n'))
      .filter(Boolean)
      .join('\n');
    Clipboard.setString(text);
  };

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => (
    <View>
      {item.input && <AppText style={styles.inputText}>{item.input}</AppText>}
      {item.output && <AppText style={styles.outputText}>{item.output}</AppText>}
    </View>
  );

  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 8 }}>
        <TouchableOpacity onPress={handleCopyAll}>
          <MaterialCommunityIcons name="content-copy" size={22} color="#888" />
        </TouchableOpacity>
      </View>
      <FlatList
        ref={flatListRef}
        data={history}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        style={styles.history}
        contentContainerStyle={styles.historyContent}
      />
    </>
  );
};

// Component to render command input
const CommandInput: React.FC<{
  command: string;
  setCommand: (text: string) => void;
  onSubmit: () => void;
  phase: string;
}> = ({ command, setCommand, onSubmit, phase}) => (
  <View style={styles.inputContainer}>
    <AppText style={styles.prompt}>$ </AppText>
    <TextInput
      style={styles.input}
      value={command}
      onChangeText={setCommand}
      onSubmitEditing={onSubmit}
      placeholder={phase === 'waitingForServerId' ? 'Server ID:' : 'Enter command...'}      placeholderTextColor="#888"
      autoCapitalize="none"
      autoCorrect={false}
      returnKeyType="send"
    />
  </View>
);

// Main component
export default function TabSettingsScreen() {
  const [conversationState, setConversationState] = useState<{
    phase: 'idle' | 'waitingForServerId' | 'waitingForJoinResponse';
    pendingPubkey?: string | null;
  }>({
    phase: 'idle',
  });
  const [command, setCommand] = useState<string>('');
  const { publicKey } = useWalletUi();
  const [pubkey, setPubkey] = useState<string | null>(null);
  useEffect(() => {
    setPubkey(publicKey?.toBase58() ?? null);
  },  [publicKey]);

  const [history, setHistory] = useState<HistoryItem[]>([
    { id: 'welcome', output: WELCOME_MESSAGE }
  ]);  const flatListRef = useRef<FlatList<HistoryItem>>(null);

  const handleCommandSubmit = async () => {
    if (command.trim() === '') return;

    const newEntry: HistoryItem = { id: Date.now().toString(), input: `> ${command}` };
    // Add the command to history immediately
    setHistory(prevHistory => [...prevHistory, newEntry, { id: 'loading', output: 'Loading...' }]);
    
    try {
      const result = await processCommand(command, pubkey, conversationState.phase);
      
      if (result.clear) {
        setHistory([]);
        setCommand('');
        setConversationState({ phase: 'idle' });  
        return;
      }

      setHistory(prevHistory => {
        // Remove any loading message before adding the result
        const filtered = prevHistory.filter(item => item.id !== 'loading');
        return [
          ...filtered,
          { id: (Date.now() + 1).toString(), output: result.output }
        ];
      });
      setCommand('');

      // Update conversation state based on command
      const cmd = command.trim().toLowerCase();
      if (cmd === '1' && conversationState.phase === 'idle') {
        setConversationState({ phase: 'waitingForServerId', pendingPubkey: pubkey });
      } else if (conversationState.phase === 'waitingForServerId') {
        // Check if the output contains the join prompt
        if (result.output && result.output.includes('Join server? [y/n]')) {
          setConversationState({ phase: 'waitingForJoinResponse', pendingPubkey: pubkey });
        } else {
          setConversationState({ phase: 'idle' });  // Reset after completion
        }
      } else if (conversationState.phase === 'waitingForJoinResponse') {
        setConversationState({ phase: 'idle' });  // Reset after join response
      }  

      // Scroll to bottom after state updates
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error processing command:', error);
      setHistory(prevHistory => {
        // Remove any loading message before adding the error
        const filtered = prevHistory.filter(item => item.id !== 'loading');
        return [
          ...filtered,
          { 
            id: (Date.now() + 1).toString(), 
            output: `Error: ${error instanceof Error ? error.message : 'Failed to process command'}` 
          }
        ];
      });
      setConversationState({ phase: 'idle' });
    }
  };

  return (
    <AppPage>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <CommandHistory history={history} flatListRef={flatListRef} />
        <CommandInput
          command={command}
          setCommand={setCommand}
          onSubmit={handleCommandSubmit}
          phase={conversationState.phase}
        />
      </KeyboardAvoidingView>
    </AppPage>
  );
}