import { AppPage } from '@/components/app-page';
import { AppText } from '@/components/app-text';
import { useWalletUi } from '@/components/solana/use-wallet-ui';
import { bonkAscii, solChat } from "@/assets/ascii";
import IQ from '@/components/iq';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import { Connection, PublicKey, Transaction, VersionedTransaction, clusterApiUrl } from '@solana/web3.js';
import { decodeWithPassword, encodeWithPassword } from "hanlock";
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import styles from './styles';
// Define your network (e.g., 'devnet', 'mainnet-beta', or a custom RPC URL)
const NETWORK = clusterApiUrl('devnet'); // Adjust as needed
const WELCOME_MESSAGE = `*Welcome to Solchat!*`;
const WELCOME_MENU = `[1] Create/Search my rooms \n[2] Enter friend's room`;
const SELECT_MESSAGE=`\nType your selection:`
const pdaCheck = async (PDA: string) => {
  try {
    const PDAPubkey = new PublicKey(PDA);
    const connection = new Connection(NETWORK);
    return await connection.getAccountInfo(PDAPubkey);
  } catch (error) {
    console.error("PDA Check failed:", error);
    return null;
  }
};
// Interfaces for UI
interface HistoryItem {
  id: string;
  input?: string;
  output?: string;
  type?: string;
  pda?: string;
  joinPrompt?: string;
}
interface CommandResult {
  type?:string;
  output?: string;
  clear?: boolean;
  pda?: string;
  joined?: boolean;
  created?: boolean;
  nickname?: string;
  serverMessageColor?: string; // change server message color
  password?:string;
  amount?:string;
  isLeavingChat?: boolean;
  joinPrompt?: string; // NEW: Added for separate join prompt rendering
}
// Simple test API call
const handleChatServerAction = async (serverId: string| null, pubkey: string | null): Promise<{
  message: string,
  pda?: string,
  type?: string,
  joinPrompt?: string
}> => {
  try {
    // valid wallet
    // A1BK8kJqG2o1uScbLjApMXBNzWGjoNjtpjaCkGQkdkY6
    // valid pda
    // BHcXCRmnPWNz31UUJEhe8W46seNrDH6ZysHyug5XNmCd
    // working mainnet PDA - just enter 'test' when prompted for serverId
    //const response = await fetch(`${iqHost}/get-server-pda/AbSAnMiSJXv6LLNzs7NMMaJjmexttg5NpQbCfXvGwq1F/${serverId}`);
    IQ.userInit();
    const iqHost = "https://iq-testbackend-381334931214.asia-northeast3.run.app"
    const response = await fetch(`${iqHost}/get-server-pda/${pubkey}/${serverId}`);
    if (!response.ok) {
      if (response.status === 500) {
        return { message: 'Error: PDA not found'};
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('DEBUG: data:', data);
    if (data && data.PDA) {
      console.log(`Fetched PDA: ${data.PDA}`);
      try {
        const pdaCheckResult = await pdaCheck(data.PDA);
        console.log('DEBUG: pdaCheckResult:', pdaCheckResult);
        if (pdaCheckResult) {
          console.log('PDA found and validated');
          // CHANGED: Return separate fields instead of concatenated message
          return {
            message: `Server found!`,
            pda: data.PDA,
            joinPrompt: `Join server? [y/n]`
          };
        } else {
          console.log('PDA check returned null/undefined, server may not exist yet');
          return {
            message: 'Server not found. Would you like to create a new server? [y/n]',
            pda: data.PDA // Still return the PDA as we'll need it for creation
          };
        }
      } catch (error) {
        console.error('Error during PDA check:', error);
        return {
          message: 'Error verifying server. The server may not exist yet. Would you like to create it? [y/n]',
          pda: data.PDA // Still return the PDA as we'll need it for creation
        };
      }
    } else {
      return { message: 'Error: could not find PDA from backend service'};
    }
  } catch (error) {
    console.error('API call failed:', error);
    return { message: 'API Error: ' + (error instanceof Error ? error.message : 'Unknown error occurred')};
  }
};
// Handle joining a chat server
const handleJoinChatServer = async (
  pda: string,
  onNewMessage: (msg: string) => void
): Promise<{ message: string; subscriptionId: number | null }> => {
  console.log(`DEBUG: joining server with PDA: ${pda}`);
  try {
    // Determine how many historical messages are available
    const sigs = await IQ.fetchDataSignatures(pda, 100);
    const totalMessages = sigs.length;
    // Only load the last 4
    const messagesToLoad = 4;
    const startIdx = Math.max(0, totalMessages - messagesToLoad);
    // Only show loading banner if there are messages to load
    const loadingBanner = totalMessages > 1
      ? `[Server] Loading last ${messagesToLoad} messages (${startIdx + 1}/${totalMessages})...`
      : `[Server] No messages in this server yet.`;
    // Show loading banner first
    onNewMessage(loadingBanner);
    // Fetch only the last 5 messages
    await IQ.getChatRecords(pda, messagesToLoad, onNewMessage);
    const subscriptionId = await IQ.joinChat(pda, onNewMessage);
    return { message: 'Joined server successfully. Listening for messages...', subscriptionId };
  } catch (error) {
    console.error('Failed to join chat:', error);
    return { message: 'Error joining server.', subscriptionId: null };
  }
};
const handleCreateChatServer = async (serverId: string, pubkey: string | null, signAndSendTransaction: (tx: Transaction | VersionedTransaction, minContextSlot?: number) => Promise<string>): Promise<{ message: string, pda?: string, joinPrompt?: string }> => { 
  try {
    if (!pubkey) throw new Error('No pubkey available');
    const userKeyString = pubkey;
    const PDA = await IQ.getServerPDA(userKeyString, serverId);
    const isPDAExist = await pdaCheck(PDA);
    if (isPDAExist) {
      // CHANGED: Return separate fields
      return { message: `Server already exists.`, pda: PDA, joinPrompt: `Join server? [y/n]` };
    }
    const transactionData = await IQ.createServerInitTransactionOnServer(userKeyString, 'group_chat', serverId, 'public');
    if (transactionData) {
      const tx = await IQ._translate_transaction(transactionData);
      const txid = await IQ.appTxSend(tx, signAndSendTransaction);
      if (txid !== 'null') {
        console.log(`Server created. TX: ${txid}`);
        // CHANGED: Return separate fields
        return { message: `Server created successfully.`, pda: PDA, joinPrompt: `Join server? [y/n]` };
      } else {
        return { message: 'Transaction send failed.' };
      }
    } else {
      return { message: 'Transaction build failed.' };
    }
  } catch (error) {
    console.error('Create server failed:', error);
    return { message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
};
// Helper to generate unique IDs for history items
const uniqueId = () => `${Date.now()}-${Math.random().toString(36).substr(2,5)}`;
// Command processing logic
const processCommand = async (
  command: string,
  pubkey: string | null,
  phase: string,
  currentPDA?: string | null,
  nickname?: string | null ,
  messagePw?: string | null
): Promise<CommandResult> => {
  const cmd = command.trim().toLowerCase();
  // Always allow /clear and /help commands
  if (cmd === '/clear') {
    return { clear: true };
  }
  if (cmd === '/help') {
    const helpText = [
      'Available commands:',
      '/clear - Clear the screen (shows main menu if in chat)',
      '/color [blue|red|green] - Change message color',
      '/pw [key] - Set decryption key for messages',
      '/sendbonk [address] [amount] - Send BONK to another user',
      '/leave - Exit the current chat room',
      '/help - Show this help message'
    ];
    return { output: helpText.join('\n') };
  }
  if (cmd === '') return {};
  if (phase === 'inChat') {
    // handle slash commands
    if (cmd.startsWith('/color ')) {
      const colorArg = cmd.split(' ')[1];
      let hex = '#1e90ff';
      switch (colorArg) {
        case 'blue':
          hex = '#1e90ff';
          break;
        case 'red':
          hex = '#ff4500';
          break;
        case 'green':
          hex = '#32cd32';
          break;
        default:
          return { output: 'Supported colors: blue, red, green' };
      }
      return { output: `Message color changed to ${colorArg}.`, serverMessageColor: hex };
    }
    if(cmd.startsWith('/pw ')){
      const pwArg = cmd.replace(/^\/pw\s+/, '').trim();
      if (!pwArg) {
        return { output: 'Usage: /pw <key> - Set decryption key' };
      }
      // Return the password to be set in the component state
      // The component will handle updating the messages with the new password
      return {
        output: 'Decryption key updated. Reprocessing messages...',
        password: pwArg
      };
    }
    if(cmd.startsWith('/sendbonk ')){
      const address = cmd.split(' ')[1];
      const amount = cmd.split(' ')[2];
      return{output:`Sent ${amount} Bonk to user ${address}`, amount: amount }
    }
    if (cmd === 'exit' || cmd === '/leave') {
      return {
        output: '[Server] Disconnecting...',
        clear: true,
        isLeavingChat: true
      };
    }
    if (messagePw){
      command = encodeWithPassword(command,messagePw);
    }
    const success = await IQ.sendChat(
      currentPDA!,
      command,
      nickname ?? 'anonymous'
    );
    if (success) {
      return { output: `[Sent] ${success}` };
    }
    else {
      return { output: 'Error sending message.' };
    }
  }
  // handle ongoing phases first
  if (phase === 'waitingForServerId') {
    const actionOutput = await handleChatServerAction(cmd, pubkey); // cmd is the serverId
    // show error to user
    if (actionOutput.message.startsWith('Error:') || actionOutput.message.startsWith('API Error:')) {
      return { output: `${actionOutput.message}\nType your selection:` };
    }
    // CHANGED: Propagate joinPrompt
    return { output: actionOutput.message, pda: actionOutput.pda, joinPrompt: actionOutput.joinPrompt };
  }
  if (phase === 'waitingForJoinResponse') {
    if (cmd === 'y' || cmd === 'yes') {
      if (!currentPDA) {
        return { output: 'Error: No PDA available for joining.' };
      }
      return { output: '[*] Preparing to join...', joined: true };
    } else if (cmd === 'n' || cmd === 'no') {
      return {
        output: [WELCOME_MESSAGE].join('\n'),type:'welcome', clear: true
      };
    } else {
      return { output: 'Please enter y or n:' };
    }
  }
  if (phase === 'waitingForCreateResponse') {
    if (cmd === 'y' || cmd === 'yes') {
      return { output: '[*] Preparing to create server...', created: true };
    } else if (cmd === 'n' || cmd === 'no') {
      return { output: WELCOME_MESSAGE,type:'welcome', clear: true };
    } else {
      return { output: 'Please enter y or n:' };
    }
  }
  if (phase === 'waitingForHandle') {
    if (cmd.length === 0) return { output: 'Nickname cannot be empty:' };
    return {
      output: `Nickname set to ${cmd}.\n\nEnable encryption? [y/n]`,
      nickname: cmd,
    };
  }
  // Handle encryption setup after nickname is set
  if (phase === 'waitingForEncryptionResponse') {
    const response = cmd.toLowerCase().trim();
    if (response === 'y') {
      return {
        output: 'Enter encryption key (any characters, case sensitive):',
      };
    } else {
      // If user doesn't want encryption, proceed without it
      return {
        output: 'Starting chat without encryption.\nType /pw <key> later to enable encryption.',
        password: undefined
      };
    }
  }
  // Handle encryption key input
  if (phase === 'waitingForEncryptionKey') {
    if (cmd.length === 0) {
      return { output: 'Encryption key cannot be empty. Please enter a key:' };
    }
    return {
      output: `Encryption enabled with key. Type /pw <key> to change encryption key\nType /leave to disconnect\nHappy Chatting!\n`,
      password: cmd
    };
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
      return { output: 'Enter Server Alias:' };
    case '2':
      return { output: 'Enter PDA:' };
    //TODO: make the error message when user do any on-chain action without the gas fee.
    default:
      if (cmd.startsWith('echo ')) {
        return { output: cmd.slice(5) };
      }
      return { output: `Command not recognized. Type /help to see available commands.` };
  }
};
// Component to render command history with tap-to-copy
const CommandHistory: React.FC<{
  history: HistoryItem[];
  flatListRef: React.RefObject<FlatList<HistoryItem> | null>;
  messageColor: string;
}> = ({ history, flatListRef, messageColor }) => {
  // Copy all history (inputs and outputs) to clipboard
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const handleTextPress = (text: string) => {
    setSelectedItem(text);
    Clipboard.setString(text);
    setCopyFeedback('Copied!');
    setTimeout(() => setCopyFeedback(null), 2000);
  };
  const handleCopyAll = () => {
    const text = history
      .map(item => [item.input, item.output].filter(Boolean).join('\n'))
      .filter(Boolean)
      .join('\n');
    Clipboard.setString(text);
  };
  const renderHistoryItem = ({ item }: { item: HistoryItem }) => {
    // ascii render
    if (item.type === 'ascii') {
      return (
        <Text key={item.id} style={styles.asciiArt}>
          {item.output}
        </Text>
      );
    }
    else if (item.type === 'welcome') {
      return (
        <Text key={item.id} style={styles.welcome}>
          {item.output}
        </Text>
      );
    }
    else if (item.type === 'welcome_menu') {
      return (
        <Text key={item.id} style={styles.welcomeMenu}>
          {item.output}
        </Text>
      );
    }
    else if (item.type === 'bonk') {
      return (
        <View key={item.id}>
          <Text style={styles.bonkAscii}>{bonkAscii}</Text>
          <Text style={styles.sendBonkTxt}>
            {item.output}
          </Text>
        </View>
      );
    }
    // default render for command input/output
    return (
      <View key={item.id}>
        {item.input && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleTextPress(item.input!)}
          >
            <AppText
              style={[
                styles.inputText,
                selectedItem === item.input && styles.selectedText
              ]}
            >
              {item.input}
            </AppText>
          </TouchableOpacity>
        )}
        {item.output && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleTextPress(item.output!)}
          >
            <AppText
              style={[
                item.output.startsWith('[Message]')
                  ? [styles.messageText, { color: messageColor }]
                  : item.output.startsWith('[Server]')
                  ? styles.prompt
                  : styles.outputText,
                selectedItem === item.output && styles.selectedText,
                // NEW: Optional styling for PDA to make it stand out as tappable
                item.type === 'pda' && { textDecorationLine: 'underline', fontWeight: 'bold', color: '#0f0' },
              ]}
            >
              {item.output}
            </AppText>
          </TouchableOpacity>
        )}
        {copyFeedback && selectedItem && (item.input === selectedItem || item.output === selectedItem) && (
          <Text style={styles.copyFeedback}>{copyFeedback}</Text>
        )}
      </View>
    );
  };
  return (
    <View style={styles.container}>
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
    </View>
  );
};
// Component to render command input
const CommandInput: React.FC<{
  command: string;
  setCommand: (text: string) => void;
  onSubmit: () => void;
  phase: string;
}> = ({ command, setCommand, onSubmit, phase }) => {
  const inputRef = useRef<TextInput>(null);
  const getPlaceholder = () => {
    if (phase === 'waitingForServerId') return 'Server ID:';
    if (phase === 'inChat') return 'Type message...';
    return 'Enter command...';
  };
  return (
    <View style={styles.inputWrapper}>
      <AppText style={styles.promptText}>$</AppText>
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={command}
        onChangeText={setCommand}
        onSubmitEditing={onSubmit}
        placeholder={getPlaceholder()}
        placeholderTextColor="#0f0"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="send"
        cursorColor="#0f0"
        selectionColor="rgba(0, 255, 0, 0.5)"
        selectTextOnFocus
        autoFocus
        // @ts-ignore - custom cursor width for Android
        cursorWidth={3}
        underlineColorAndroid="transparent" // Removes Android default underline to prevent grey artifacts
      />
    </View>
  );
};
// Main component
export default function TabSettingsScreen() {
  const [conversationState, setConversationState] = useState<{
    phase: 'idle' | 'waitingForServerId' | 'waitingForJoinResponse' | 'inChat' | 'waitingForCreateResponse' | 'waitingForHandle' | 'waitingForPdaInput' | 'waitingForEncryptionResponse' | 'waitingForEncryptionKey';
    pendingPubkey?: string | null;
    currentPDA?: string | null;
    currentServerId?: string;
    nickname?: string | null;
  }>({
    phase: 'idle',
  });
  const subscriptionRef = useRef<number | null>(null);
  const [command, setCommand] = useState<string>('');
  const { publicKey, signAndSendTransaction, isUserInitialized } = useWalletUi();
  const [pubkey, setPubkey] = useState<string | null>(null);
  useEffect(() => {
    setPubkey(publicKey?.toBase58() ?? null);
  }, [publicKey]);
  const [messageColor, setMessageColor] = useState<string>('#1e90ff');
  const [messagePw, setMessagePW] = useState<string>('');
  const messagePwRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Load saved encryption key on mount
  useEffect(() => {
    const loadEncryptionKey = async () => {
      try {
        const savedKey = await AsyncStorage.getItem('@solchat:encryptionKey');
        if (savedKey) {
          setMessagePW(savedKey);
          messagePwRef.current = savedKey;
        }
      } catch (e) {
        console.error('Failed to load encryption key', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadEncryptionKey();
  }, []);
  // Save encryption key when it changes
  useEffect(() => {
    const saveEncryptionKey = async () => {
      if (messagePw) {
        try {
          await AsyncStorage.setItem('@solchat:encryptionKey', messagePw);
        } catch (e) {
          console.error('Failed to save encryption key', e);
        }
      }
    };
    saveEncryptionKey();
    messagePwRef.current = messagePw;
  }, [messagePw]);
  const [history, setHistory] = useState<HistoryItem[]>([
    { id: 'solchat', output: solChat, type: 'ascii' },
    { id: 'welcome', output: WELCOME_MESSAGE, type: 'welcome' },
    { id: 'welcome_menu', output: WELCOME_MENU, type: 'welcome_menu' },
    { id: 'select_message', output: SELECT_MESSAGE, type: 'select_message' }
  ]);
  const flatListRef = useRef<FlatList<HistoryItem>>(null);
  const handleJoinChatServerWrapper = async (pda: string, onNewMessage: (msg: string) => void): Promise<{ message: string; subscriptionId: number | null }> => {
    setConversationState(prev => ({ ...prev, phase: 'waitingForJoinResponse' }));
    // Ensure UI updates before showing loading state
    await new Promise(resolve => setTimeout(resolve, 50));
    try {
      // Call the imported handleJoinChatServer function from the top of the file
      const result = await handleJoinChatServer(pda, onNewMessage);
      return result;
    } catch (error) {
      console.error('Error joining chat server:', error);
      return { message: 'Failed to join chat server. Please try again.', subscriptionId: null };
    }
  };
  const handleCreateChatServerWrapper = async (serverId: string, pubkey: string | null, signAndSendTransaction: (tx: Transaction | VersionedTransaction) => Promise<string>): Promise<{ message: string; pda?: string; joinPrompt?: string }> => {
    setConversationState(prev => ({ ...prev, phase: 'waitingForCreateResponse' }));
    // Ensure UI updates before showing loading state
    await new Promise(resolve => setTimeout(resolve, 50));
    try {
      // Call the imported handleCreateChatServer function from the top of the file
      const result = await handleCreateChatServer(serverId, pubkey, signAndSendTransaction);
      return result;
    } catch (error) {
      console.error('Error creating chat server:', error);
      return { message: 'Failed to create chat server. Please try again.', pda: undefined };
    }
  };
  const handleSetNickname = (nickname: string) => {
    setConversationState(prev => ({ ...prev, nickname, phase: 'waitingForEncryptionResponse' }));
    // Small delay to ensure state updates before scrolling
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return { output: `Nickname set to: ${nickname}\n\nEnable end-to-end encryption? (y/n)` };
  };
  // Auto-scroll to bottom when history or conversation state changes
  useEffect(() => {
    if (flatListRef.current) {
      // Small delay to ensure the UI has updated
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [history, conversationState.phase]);
  // Auto-scroll to bottom when history or conversation state changes
  useEffect(() => {
    if (flatListRef.current) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [history, conversationState.phase]);
  const onNewMessage = (msg: string, isHistorical = false) => {
    // Don't process system messages or already processed messages
    const isSystemMessage = msg.startsWith('[') || msg.startsWith('>');
    const shouldDecrypt = messagePwRef.current && msg.includes(': ') && !isSystemMessage;
    let processedMsg = msg;
    let decrypted = false;
    if (shouldDecrypt && messagePwRef.current) {
      try {
        const [handle, encrypted] = msg.split(': ');
        if (encrypted) {
          const decryptedContent = decodeWithPassword(encrypted, messagePwRef.current);
          processedMsg = `${handle}: ${decryptedContent}`;
          decrypted = true;
        }
      } catch (e) {
        console.error('Failed to decrypt message:', e);
      }
    }
    const newMessage = {
      id: uniqueId(),
      output: isSystemMessage ? processedMsg : `[Chat] ${processedMsg}`,
      type: decrypted ? 'decrypted' : undefined
    };
    setHistory(prev => [...prev, newMessage]);
  };
  useEffect(() => {
    return () => {
      if (subscriptionRef.current !== null) {
        const connection = new Connection(clusterApiUrl('devnet'), 'finalized'); // Match IQ's network
        connection.removeOnLogsListener(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, []);
  const handleCommandSubmit = async () => {
    const lowerCmd = command.trim().toLowerCase();
    // Auto-scroll when command is submitted
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);
    // Auto-scroll when command is submitted
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);
    // if user is not initialized, block actions
    if (isUserInitialized === false) {
      const restrictedPhases = ['idle', 'waitingForServerId', 'waitingForJoinResponse', 'waitingForCreateResponse', 'waitingForPdaInput'];
      const wantsRestricted = (conversationState.phase === 'idle' && (lowerCmd === '1' || lowerCmd === '2')) || restrictedPhases.includes(conversationState.phase as string);
      if (wantsRestricted) {
        setHistory(prev => [...prev, { id: uniqueId(), output: '[Server] Wallet not initialized. Please airdrop SOL to your wallet and reconnect before creating or joining a chatroom.' }]);
        setCommand('');
        return;
      }
    }
    if (command.trim() === '') return;
    const newEntry: HistoryItem = { id: uniqueId(), input: `> ${command}` };
    setHistory(prevHistory => [...prevHistory, newEntry, { id: uniqueId(), output: 'Loading...' }]);
    try {
      const result = await processCommand(command,
        pubkey,
        conversationState.phase,
        conversationState.currentPDA,
        conversationState.nickname,
        messagePw
      );
      if (result.clear) {
        // handle /leave command - show disconnecting and clear to welcome screen
        if (result.isLeavingChat && conversationState.phase === 'inChat') {
          // unsubscribe from chat if needed
          if (subscriptionRef.current !== null) {
            const connection = new Connection(clusterApiUrl('devnet'), 'finalized');
            connection.removeOnLogsListener(subscriptionRef.current);
            subscriptionRef.current = null;
          }
          // show disconnecting message briefly
          setHistory([
            { id: uniqueId(), output: result.output || '[Server] Disconnecting...' }
          ]);
          // short delay before clearing to welcome screen
          setTimeout(() => {
            setHistory([
              { id: uniqueId(), output: solChat, type: 'ascii' },
              { id: uniqueId(), output: WELCOME_MESSAGE, type: 'welcome' },
              { id: uniqueId(), output: WELCOME_MENU, type: 'welcome_menu' },
              { id: uniqueId(), output: SELECT_MESSAGE, type: 'select_message' }
            ]);
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 500);
          setConversationState(prev => ({ ...prev, phase: 'idle', currentPDA: null }));
        }
        // handle /clear command - just clear the screen
        else {
          setHistory([]);
        }
        setMessageColor('#1e90ff');
        setCommand('');
        setMessagePW('');
        return;
      }
      if (result.serverMessageColor) {
        setMessageColor(result.serverMessageColor);
      }
      if(result.password){
        // First set the password
        setMessagePW(result.password);
        // Create decrypted versions of existing messages and append them
        setHistory(prevHistory => {
          const newEntries: HistoryItem[] = [];
          // Keep all original messages
          const updatedHistory = [...prevHistory];
          // Find and add decrypted versions of encrypted messages
          prevHistory.forEach(msg => {
            if (msg.output && msg.output.includes(': ')) {
              const [handle, encrypted] = msg.output.split(': ');
              try {
                const decrypted = decodeWithPassword(encrypted, result.password!);
                // Only add if decryption was successful and different from original
                if (decrypted !== encrypted) {
                  newEntries.push({
                    id: `${msg.id}-decrypted`,
                    output: `[Decrypted] ${handle}: ${decrypted}`,
                    type: 'decrypted'
                  });
                }
              } catch (e) {
                // Skip if decryption fails
              }
            }
          });
          // Append all new decrypted messages
          return [...updatedHistory, ...newEntries];
        });
      }
      if(result.amount){
        setHistory(prev => [
          ...prev,
          { id: uniqueId(), output: result.output ,type:'bonk'}
        ]);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
        setCommand('');
        return;
      }
      if (result.nickname) {
        setHistory(prev => {
          const filtered = prev.filter(item => item.id !== 'loading');
          return [
            ...filtered,
            { id: uniqueId(), output: result.output ?? `Nickname set to ${result.nickname}.` },
          ];
        });
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
        setCommand('');
        // Move to encryption prompt phase
        setConversationState(prev => ({
          ...prev,
          phase: 'waitingForEncryptionResponse',
          nickname: result.nickname,
        }));
        return;
      }
      // Handle encryption response (yes/no)
      if (conversationState.phase === 'waitingForEncryptionResponse') {
        setHistory(prev => {
          const filtered = prev.filter(item => item.id !== 'loading');
          const response = command.trim().toLowerCase();
          let newOutput = '';
          if (response === 'y') {
            newOutput = 'Enter encryption key (any characters, case sensitive):';
            // Move to encryption key input phase
            setConversationState(prev => ({
              ...prev,
              phase: 'waitingForEncryptionKey'
            }));
          } else {
            newOutput = 'Starting chat without encryption.\nType /pw <key> later to enable encryption.';
            // Move to chat phase without encryption
            setConversationState(prev => ({
              ...prev,
              phase: 'inChat'
            }));
          }
          return [
            ...filtered,
            { id: uniqueId(), output: newOutput },
          ];
        });
        setCommand('');
        return;
      }
      // Handle encryption key input
      if (conversationState.phase === 'waitingForEncryptionKey') {
        const key = command.trim();
        if (key.length === 0) {
          setHistory(prev => [
            ...prev.filter(item => item.id !== 'loading'),
            { id: uniqueId(), output: 'Encryption key cannot be empty. Please enter a key:' }
          ]);
          return;
        }
        setHistory(prev => {
          const filtered = prev.filter(item => item.id !== 'loading');
          return [
            ...filtered,
            { id: uniqueId(), output: `Encryption enabled with key. Starting chat...\nType /pw <key> to change encryption key.` },
          ];
        });
        setMessagePW(key);
        setCommand('');
        setConversationState(prev => ({
          ...prev,
          phase: 'inChat'
        }));
        return;
      }
      // CHANGED: Update history with the result, splitting into multiple items if PDA and joinPrompt are present (for 1-tap PDA copy)
      setHistory(prevHistory => {
        const filtered = prevHistory.filter(item => item.id !== 'loading');
        if (result.pda && result.output && result.joinPrompt) {
          return [
            ...filtered,
            { id: uniqueId(), output: result.output },
            { id: uniqueId(), output: 'PDA (share this to your friends):' },
            { id: uniqueId(), output: result.pda, type: 'pda' },
            { id: uniqueId(), output: result.joinPrompt }
          ];
        } else if (result.output) {
          return [
            ...filtered,
            { id: uniqueId(), output: result.output }
          ];
        }
        return filtered;
      });
      // Clear the command input
      setCommand('');
      // Ensure we're not stuck in a loading state
      if (conversationState.phase === 'waitingForServerId' && result.pda) {
        // If we have a PDA but no output, we might be stuck
        if (!result.output) {
          setHistory(prev => [
            ...prev.filter(item => item.id !== 'loading'),
            {
              id: uniqueId(),
              output: `Server found!`
            },
            {
              id: uniqueId(),
              output: 'PDA (share this to your friends):'
            },
            {
              id: uniqueId(),
              output: result.pda,
              type: 'pda'
            },
            {
              id: uniqueId(),
              output: 'Join server? [y/n]'
            }
          ]);
          setConversationState(prev => ({
            ...prev,
            phase: 'waitingForJoinResponse',
            currentPDA: result.pda,
            pendingPubkey: pubkey
          }));
          return;
        }
      }
      // If we just sent a message (indicated by [Sent] in the output)
      // and we're in a chat, trigger an immediate message fetch
      if (result.output && result.output.includes('[Sent]') && conversationState.phase === 'inChat' && conversationState.currentPDA) {
        try {
          // Fetch the latest messages after a short delay to ensure the transaction is processed
          setTimeout(async () => {
            await IQ.getChatRecords(conversationState.currentPDA!, 1, (msg) => {
              // Only process the message if it's not already in the history
              setHistory(prev => {
                const messageExists = prev.some(item =>
                  item.output && item.output.includes(msg)
                );
                if (!messageExists) {
                  return [...prev, { id: uniqueId(), output: msg }];
                }
                return prev;
              });
            });
          }, 3000); // 1 second delay to ensure the transaction is processed
        } catch (error) {
          console.error('Error fetching messages after send:', error);
        }
      }
      // update conversation state based on command
      const cmd = command.trim().toLowerCase();
      if (cmd === '1' && conversationState.phase === 'idle') {
        setConversationState(prev => ({ ...prev, phase: 'waitingForServerId', pendingPubkey: pubkey }));
      } else if (conversationState.phase === 'waitingForServerId') {
        // check if output contains the join prompt
        if (result.output && result.joinPrompt) { // CHANGED: Check for joinPrompt instead of string includes
          setConversationState(prev => ({
            ...prev,
            phase: 'waitingForJoinResponse',
            pendingPubkey: pubkey,
            currentPDA: result.pda || prev.currentPDA // Use result.pda if available
          }));
        } else if (result.output && result.output.includes('create a new server? [y/n]')) {
          setConversationState(prev => ({
            ...prev,
            phase: 'waitingForCreateResponse',
            currentServerId: command.trim(),
          }));
        } else {
          setConversationState(prev => ({ ...prev, phase: 'idle' }));
        }
      } else if (conversationState.phase === 'waitingForCreateResponse') {
        if (cmd === 'n' || cmd === 'no') {
          // User chose not to create a server, return to main menu
          setHistory(prev => [
            ...prev.filter(item => item.id !== 'loading'),
            { id: uniqueId(), output: WELCOME_MESSAGE, type: 'welcome' },
            { id: uniqueId(), output: WELCOME_MENU, type: 'welcome_menu' }
          ]);
          setConversationState(prev => ({
            ...prev,
            phase: 'idle',
            currentServerId: undefined
          }));
          return;
        } else if (cmd === 'y' || cmd === 'yes') {
          // Handle server creation confirmation
          if (conversationState.currentServerId && pubkey) {
            const createResult = await handleCreateChatServerWrapper(
              conversationState.currentServerId,
              pubkey,
              signAndSendTransaction
            );
            if (createResult.pda) {
              setConversationState(prev => ({
                ...prev,
                phase: 'waitingForJoinResponse',
                currentPDA: createResult.pda
              }));
              // CHANGED: Show the join prompt as split items
              setHistory(prev => [
                ...prev.filter(item => item.id !== 'loading'),
                { id: uniqueId(), output: createResult.message || 'Server created successfully!' },
                { id: uniqueId(), output: 'PDA (share this to your friends):' },
                { id: uniqueId(), output: createResult.pda, type: 'pda' },
                { id: uniqueId(), output: createResult.joinPrompt || 'Join server? [y/n]' }
              ]);
            } else {
              setHistory(prev => [
                ...prev.filter(item => item.id !== 'loading'),
                {
                  id: uniqueId(),
                  output: createResult.message || 'Failed to create server. Please try again.'
                }
              ]);
              setConversationState(prev => ({ ...prev, phase: 'idle' }));
            }
          }
        }
      } else if (conversationState.phase === 'waitingForJoinResponse') {
        if (!result.joined) {
          setConversationState(prev => ({ ...prev, phase: 'idle' }));
        }
      }
      if (cmd === '2' && conversationState.phase === 'idle') {
        // Enter chat room
        setConversationState(prev => ({ ...prev, phase: 'waitingForPdaInput' }));
      }else if (conversationState.phase === 'waitingForPdaInput') {
        const pda = command.trim();
        const { message: joinOutput, subscriptionId } = await handleJoinChatServerWrapper(pda, onNewMessage);
        subscriptionRef.current = subscriptionId;
        // UI display
        setHistory(prev => [
          ...prev,
          { id: uniqueId(), output: joinOutput },
          { id: uniqueId(), output: 'Choose a nickname:' }
        ]);
        setConversationState(prev => ({ ...prev, phase: 'waitingForHandle', currentPDA: pda }));
        return;
      }
      if (result.joined && conversationState.currentPDA) {
        const { message: joinOutput, subscriptionId } = await handleJoinChatServerWrapper(conversationState.currentPDA, onNewMessage);
        subscriptionRef.current = subscriptionId;
        setHistory(prev => {
          const lastItem = prev[prev.length - 1];
          if (lastItem.output === 'Preparing to join...') {
            // Replace dummy output
            return [...prev.slice(0, -1), { ...lastItem, output: joinOutput, id: uniqueId() }];
          }
          return [...prev, { id: uniqueId(), output: joinOutput }];
        });
        setHistory(prev => [
          ...prev,
          { id: uniqueId(), output: 'Choose a nickname:' }
        ]);
        setConversationState(prev => ({ ...prev, phase: 'waitingForHandle' }));
      }
    } catch (error) {
      console.error('Error processing command:', error);
      setHistory(prev => [
        ...prev,
        {
          id: uniqueId(),
          output: `Error: ${error instanceof Error ? error.message : 'Failed to process command'}`
        }
      ]);
      setConversationState(prev => ({ ...prev, phase: 'idle', currentPDA: null }));
    }
  };
  return (
    <AppPage>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <CommandHistory history={history} flatListRef={flatListRef} messageColor={messageColor} />
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