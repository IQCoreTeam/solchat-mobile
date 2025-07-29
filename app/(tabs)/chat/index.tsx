import { AppPage } from '@/components/app-page';
import { AppText } from '@/components/app-text';
import { useWalletUi } from '@/components/solana/use-wallet-ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Clipboard from '@react-native-clipboard/clipboard';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, TextInput, TouchableOpacity, View } from 'react-native';
import styles from './styles';


// TypeScript interface for history items
interface HistoryItem {
  id: string;
  input?: string;
  output?: string;
}

// Simple test API call
const handleChatServerAction = async (serverId: string| null, pubkey: string | null): Promise<string> => {
  try {
    // valid address for PDA:
    // A1BK8kJqG2o1uScbLjApMXBNzWGjoNjtpjaCkGQkdkY6
    const iqHost = "https://solanacontractapi.uc.r.appspot.com"

    //const response = await fetch(`${iqHost}/get-server-pda/${pubkey}/${serverId}`);
    const response = await fetch(`${iqHost}/get-server-pda/A1BK8kJqG2o1uScbLjApMXBNzWGjoNjtpjaCkGQkdkY6/${serverId}`);

    if (!pubkey) {
      return 'Error: No public key found';
    }
    
    if (!response.ok) {
      if (response.status === 500) {
        return `Error: DBPDA not found for pubkey ${pubkey}`;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data && data.DBPDA) {
      console.log(`Fetched DBPDA for pubkey ${pubkey} | ${data.DBPDA}`);

      return `Fetched DBPDA for pubkey ${pubkey} | ${data.DBPDA}`;
    } else {
      return 'Error: DBPDA not found in response';
    }
  } catch (error) {
    console.error('API call failed:', error);
    return `API Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
  }
};

// Command processing logic
const processCommand = async (command: string, pubkey: string | null, phase: string): Promise<{ output?: string; clear?: boolean }> => {
  const cmd = command.trim().toLowerCase();

  if (cmd === '') return {};
  // Handle ongoing phases first
  if (phase === 'waitingForServerId') {
  // Use this input as serverId and complete the action
  const actionOutput = await handleChatServerAction(pubkey, cmd);  // cmd is the serverId
  if (actionOutput.startsWith('Error:') || actionOutput.startsWith('API Error:')) {
    // Append prompt after error
    return { output: `${actionOutput}\nType your selection:` };
  }
return { output: actionOutput };
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
    phase: 'idle' | 'waitingForServerId';
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


  const WELCOME_MESSAGE = `Welcome to Solchat!\n[1] Create or search chat server\n[2] Enter chat room\nType your selection:`;

  const [history, setHistory] = useState<HistoryItem[]>([
    { id: 'welcome', output: WELCOME_MESSAGE }
  ]);  const flatListRef = useRef<FlatList<HistoryItem>>(null);

  const handleCommandSubmit = async () => {
    if (command.trim() === '') return;

    const newEntry: HistoryItem = { id: Date.now().toString(), input: `> ${command}` };
    // Add the command to history immediately
    setHistory(prevHistory => [...prevHistory, newEntry]);
    
    try {
      const result = await processCommand(command, pubkey, conversationState.phase);
      
      if (result.clear) {
        setHistory([]);
        setCommand('');
        setConversationState({ phase: 'idle' });  
        return;
      }

      setHistory(prevHistory => [
        ...prevHistory,
        { id: (Date.now() + 1).toString(), output: result.output }
      ]);
      setCommand('');

      // Update conversation state based on command
      const cmd = command.trim().toLowerCase();
      if (cmd === '1' && conversationState.phase === 'idle') {
        setConversationState({ phase: 'waitingForServerId', pendingPubkey: pubkey });
      } else if (conversationState.phase === 'waitingForServerId') {
        setConversationState({ phase: 'idle' });  // Reset after completion
      }  

      // Scroll to bottom after state updates
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error processing command:', error);
      setHistory(prevHistory => [
        ...prevHistory,
        { 
          id: (Date.now() + 1).toString(), 
          output: `Error: ${error instanceof Error ? error.message : 'Failed to process command'}` 
        }
      ]);
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