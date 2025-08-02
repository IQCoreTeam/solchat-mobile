import { AppPage } from '@/components/app-page';
import { AppText } from '@/components/app-text';
import { useWalletUi } from '@/components/solana/use-wallet-ui';

import IQ from '@/components/iq';
import {  encodeWithPassword,decodeWithPassword } from "hanlock";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Clipboard from '@react-native-clipboard/clipboard';
import { Connection, PublicKey, Transaction, VersionedTransaction, clusterApiUrl } from '@solana/web3.js';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, TextInput, TouchableOpacity, View ,Text} from 'react-native';
import styles from './styles';
import {solChat,bonkAscii} from "@/assets/ascii"

// Define your network (e.g., 'devnet', 'mainnet-beta', or a custom RPC URL)
const NETWORK = clusterApiUrl('devnet');  // Adjust as needed
const WELCOME_MESSAGE = `*Welcome to Solchat!*`;
const WELCOME_MENU = `[1] Create/Search room   [2] Enter room`;
const SELECT_MESSAGE=`\nType your selection:`
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
  type?:string;
}

interface CommandResult {
    type?:string;
  output?: string;
  clear?: boolean;
  pda?: string;
  joined?: boolean;
  created?: boolean;
  nickname?: string;
  color?: string; // change server message color
  password?:string;
    amount?:string;
}

// Simple test API call
const handleChatServerAction = async (serverId: string| null, pubkey: string | null): Promise<{ message: string, pda?: string }> => {
  try {
    // valid wallet
    // A1BK8kJqG2o1uScbLjApMXBNzWGjoNjtpjaCkGQkdkY6
    // valid pda
    // BHcXCRmnPWNz31UUJEhe8W46seNrDH6ZysHyug5XNmCd
    console.log(`DEBUG: in handleChatServerAction`)
    console.log(`DEBUG: serverId : ${serverId}`)
    console.log(`DEBUG: pubkey : ${pubkey}`)

    IQ.userInit();
    //const pubkeyFromSdk = await IQ.getMyPublicKey();
    //await IQ.userInit();
    //await IQ.codeIn("Hello World", "app-test", "example-handle");
    //console.log(`DEBUG: pubkeyFromSdk : ${pubkeyFromSdk}`)
    const iqHost = "https://iq-testbackend-381334931214.asia-northeast3.run.app"

    // working mainnet PDA - just enter 'test' when prompted for serverId
    //const response = await fetch(`${iqHost}/get-server-pda/AbSAnMiSJXv6LLNzs7NMMaJjmexttg5NpQbCfXvGwq1F/${serverId}`);

    console.log(`DEBUG: fetching ${iqHost}/get-server-pda/${pubkey}/${serverId}`);

    const response = await fetch(`${iqHost}/get-server-pda/${pubkey}/${serverId}`);

    console.log(`DEBUG: response body : ${response.body}`)
    console.log(`DEBUG: response status : ${response.status}`)

    console.log(`DEBUG: response : ${response}`)
    if (!response.ok) {
      if (response.status === 500) {
        return { message: 'Error: PDA not found'};
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
        return { message: `Located server at PDA\n${data.PDA}\n\nJoin server? [y/n]`, pda: data.PDA }        //return `Server exists.\nPDA: ${data.PDA}\n\nJoin server? [y/n]`;
      }
      else {
        console.log(`PDA not found. Prompting user to create a new server`);
        return { message: 'PDA not found. Would you like to create a new server? [y/n]'};
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
    const count = sigs.length;
    const loadingBanner = `[Server] Loading ${count} messages ...`;

    // Show loading banner first
    onNewMessage(loadingBanner);

    // Fetch historical messages
    await IQ.getChatRecords(pda, 50, onNewMessage);

    const subscriptionId = await IQ.joinChat(pda, onNewMessage);
    return { message: 'Joined server successfully. Listening for messages...', subscriptionId };
  } catch (error) {
    console.error('Failed to join chat:', error);
    return { message: 'Error joining server.', subscriptionId: null };
  }
};

const handleCreateChatServer = async (serverId: string, pubkey: string | null, signAndSendTransaction: (tx: Transaction | VersionedTransaction, minContextSlot?: number) => Promise<string>): Promise<{ message: string, pda?: string }> => {  try {
    if (!pubkey) throw new Error('No pubkey available');
    const userKeyString = pubkey;
    const PDA = await IQ.getServerPDA(userKeyString, serverId);
    const isPDAExist = await pdaCheck(PDA);
    if (isPDAExist) {
      return { message: `Server already exists.\nPDA: ${PDA}\n\nJoin server? [y/n]`, pda: PDA };
    }
    const transactionData = await IQ.createServerInitTransactionOnServer(userKeyString, 'group_chat', serverId, 'public');
    if (transactionData) {
      const tx = await IQ._translate_transaction(transactionData);
      const txid = await IQ.appTxSend(tx, signAndSendTransaction);
      if (txid !== 'null') {
        console.log(`Server created. TX: ${txid}`);
        return { message: `Server created successfully.\nPDA: ${PDA}\n\nJoin server? [y/n]`, pda: PDA };
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

const appTxSend = async (tx: Transaction, signTransaction: (tx: Transaction) => Promise<Transaction>): Promise<string> => {
  try {
    const connection = new Connection(NETWORK, 'confirmed');  // Use your app's NETWORK (devnet)
    let blockHash = await connection.getLatestBlockhash();
    while (!blockHash) {  // Retry if undefined
      blockHash = await connection.getLatestBlockhash();
    }
    tx.recentBlockhash = blockHash.blockhash;
    tx.lastValidBlockHeight = blockHash.lastValidBlockHeight;
    // feePayer should be set in the tx from backend (user's pubkey)
    const signedTx = await signTransaction(tx);  // Wallet signs
    const txid = await connection.sendTransaction(signedTx, [], { skipPreflight: true });  // Empty signers array, options third
    await connection.confirmTransaction({
      signature: txid,
      blockhash: blockHash.blockhash,  // Add this
      lastValidBlockHeight: blockHash.lastValidBlockHeight,
    });
    return txid;
  } catch (error) {
    console.error('Transaction send failed:', error);
    return 'null';
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

  // Always allow /help command
  if (cmd === '/help') {
    const helpText = [
      'Available commands:',
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
      return { output: `Message color changed to ${colorArg}.`, color: hex };
    }
   if(cmd.startsWith('/pw ')){
       const pwArg = cmd.replace(/^\/pw\s+/, '').trim();
       return { output: `Decode key Set to to ${pwArg}.`, password: pwArg };
   }
   if(cmd.startsWith('/sendbonk ')){
        const address = cmd.split(' ')[1];
       const amount = cmd.split(' ')[2];

       return{output:`Sent ${amount} Bonk to user ${address}`, amount: amount }
       }

    if (cmd === 'exit' || cmd === '/leave') {
      return { output: 'Leaving chat...', clear: true };

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
  // Handle ongoing phases first
  if (phase === 'waitingForServerId') {
  // Use this input as serverId and complete the action
  const actionOutput = await handleChatServerAction(cmd, pubkey);  // cmd is the serverId
  if (actionOutput.message.startsWith('Error:') || actionOutput.message.startsWith('API Error:')) {
    // Append prompt after error
    return { output: `${actionOutput.message}\nType your selection:` };
  }
  return { output: actionOutput.message, pda: actionOutput.pda };
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
      return { output: '[*] Preparing to create server...', created: true };  // Flag to trigger in component
    } else if (cmd === 'n' || cmd === 'no') {
      return {  output: WELCOME_MESSAGE,type:'welcome', clear: true };
    } else {
      return { output: 'Please enter y or n:' };
    }
  }
  if (phase === 'waitingForHandle') {
    if (cmd.length === 0) return { output: 'Nickname cannot be empty:' };
    return {
      output: `Nickname set to ${cmd}. Start chatting!`,
      nickname: cmd,
    };  // custom field we’ll use below
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
      return { output: 'Enter PDA:' };
      //TODO: make the error message when user do any on-chain action without the gas fee.
    default:
      if (cmd.startsWith('echo ')) {
        return { output: cmd.slice(5) };
      }
      return { output: `Command not recognized. Type /help to see available commands.` };
  }
};


// Component to render command history
const CommandHistory: React.FC<{
  history: HistoryItem[];
  flatListRef: React.RefObject<FlatList<HistoryItem> | null>;
  messageColor: string;
}> = ({ history, flatListRef, messageColor }) => {
  // Copy all history (inputs and outputs) to clipboard
  const handleCopyAll = () => {
    const text = history
      .map(item => [item.input, item.output].filter(Boolean).join('\n'))
      .filter(Boolean)
      .join('\n');
    Clipboard.setString(text);
  };

   const renderHistoryItem = ({ item }: { item: HistoryItem }) => {
      //  ascii render
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
               <View>
               <Text style={styles.bonkAscii}> {bonkAscii}</Text>
                 <Text key={item.id} style={styles.sendBonkTxt}>
                      {item.output}
                 </Text>
                 </View>
                );
           }
      // default
      return (
        <View>
          {item.input && <AppText style={styles.inputText}>{item.input}</AppText>}
          {item.output && (
            <AppText
              style={
                item.output.startsWith('[Message]')
                  ? [styles.messageText, { color: messageColor }]
                  : item.output.startsWith('[Server]')
                  ? styles.prompt
                  : styles.outputText
              }
            >
              {item.output}
            </AppText>
          )}
        </View>
      );
    };

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
      placeholder={phase === 'waitingForServerId' ? 'Server ID:' : phase === 'inChat' ? 'Type message...' : 'Enter command...'}      placeholderTextColor="#888"
      autoCapitalize="none"
      autoCorrect={false}
      returnKeyType="send"
    />
  </View>
);

// Main component
export default function TabSettingsScreen() {
  const [conversationState, setConversationState] = useState<{
    phase: 'idle' | 'waitingForServerId' | 'waitingForJoinResponse' | 'inChat' | 'waitingForCreateResponse' | 'waitingForHandle'| 'waitingForPdaInput';
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
  },  [publicKey]);

  const [messageColor, setMessageColor] = useState<string>('#1e90ff');
const [messagePw, setMessagePW] = useState<string>('');
const messagePwRef = useRef<string | null>(null);

useEffect(() => {
  messagePwRef.current = messagePw;
}, [messagePw]);
  const [history, setHistory] = useState<HistoryItem[]>([
      { id: 'solchat', output: solChat, type: 'ascii' },
      { id: 'welcome', output: WELCOME_MESSAGE ,type:'welcome'},
      { id: 'welcome_menu', output: WELCOME_MENU ,type:'welcome_menu'},
      { id: 'select_message', output: SELECT_MESSAGE ,type:'select_message'}
  ]);  const flatListRef = useRef<FlatList<HistoryItem>>(null);

  const onNewMessage = (msg: string) => {
    if (messagePwRef.current && msg.includes(': ')) {
         const [handle, encrypted] = msg.split(': ');
         const decrypted = decodeWithPassword(encrypted, messagePwRef.current);
         msg = `${handle}: ${decrypted}`;
       }

    setHistory(prev => [
      ...prev,
      { id: uniqueId(), output: msg.startsWith('[') ? msg : `[Message] ${msg}` }
    ]);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };
  useEffect(() => {
    return () => {
      if (subscriptionRef.current !== null) {
        const connection = new Connection(clusterApiUrl('devnet'), 'finalized');  // Match IQ's network
        connection.removeOnLogsListener(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, []);

  const handleCommandSubmit = async () => {
    const lowerCmd = command.trim().toLowerCase();
    // Block restricted actions if user not initialized
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
    // Add the command to history immediately
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
        // Unsubscribe from any active chat log listener
        if (subscriptionRef.current !== null) {
          const connection = new Connection(clusterApiUrl('devnet'), 'finalized');
          connection.removeOnLogsListener(subscriptionRef.current);
          subscriptionRef.current = null;
        }
        setHistory(prev => [
          ...prev,
          { id: uniqueId(), output: '[Server] Disconnecting...' },
          { id: uniqueId(), output: '-------------------------------------' },
          { id: uniqueId(), output: solChat, type: 'ascii' },
          { id: uniqueId(), output: WELCOME_MESSAGE ,type:'welcome'},
          { id: uniqueId(), output: WELCOME_MENU ,type:'welcome_menu'},
          { id: uniqueId(), output: SELECT_MESSAGE ,type:'select_message'}
        ]);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
        setMessageColor('#1e90ff');
        setCommand('');
        setMessagePW('')
        setConversationState(prev => ({ ...prev, phase: 'idle', currentPDA: null }));
        return;
      }

      if (result.color) {
         setMessageColor(result.color);
       }
      if(result.password){
          setMessagePW(result.password);
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
        // Remove loading entry and add nickname confirmation
        setHistory(prev => {
           const filtered = prev.filter(item => item.id !== 'loading');
           return [
             ...filtered,
             { id: uniqueId(), output: result.output ?? `Nickname set to ${result.nickname}. Start chatting!` },
           ];
         });
         setTimeout(() => {
           flatListRef.current?.scrollToEnd({ animated: true });
         }, 100);
         setCommand('');
         setConversationState(prev => ({
           ...prev,
           phase: 'inChat',
           nickname: result.nickname,
         }));
         return;
      }

      setHistory(prevHistory => {
        // Remove any loading message before adding the result
        const filtered = prevHistory.filter(item => item.id !== 'loading');
        return [
          ...filtered,
          { id: uniqueId(), output: result.output }
        ];
      });
      setCommand('');

      // Update conversation state based on command
      const cmd = command.trim().toLowerCase();

      if (cmd === '1' && conversationState.phase === 'idle') {
        setConversationState(prev => ({ ...prev, phase: 'waitingForServerId', pendingPubkey: pubkey }));
      } else if (conversationState.phase === 'waitingForServerId') {
        // Check if the output contains the join prompt
        if (result.output && result.output.includes('Join server? [y/n]')) {
          setConversationState(prev => ({
                       ...prev,
                     phase: 'waitingForJoinResponse',
                     pendingPubkey: pubkey,
                     currentPDA: result.pda || prev.currentPDA  // Use result.pda if available
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

       const { message: joinOutput, subscriptionId } = await handleJoinChatServer(pda, onNewMessage);
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
         const { message: joinOutput, subscriptionId } = await handleJoinChatServer(conversationState.currentPDA, onNewMessage);
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
          { id: uniqueId(), output: 'Choose a nickname:' },
        ]);
        setConversationState(prev => ({ ...prev, phase: 'waitingForHandle' }));
        return;
         //setConversationState(prev => ({ ...prev, phase: 'inChat' }));
       }

       if (result.created && conversationState.currentServerId && pubkey) {
        const createResult = await handleCreateChatServer(conversationState.currentServerId, pubkey, signAndSendTransaction);
        setHistory(prev => {
          const lastItem = prev[prev.length - 1];
          if (lastItem.output === 'Preparing to create server...') {
            return [...prev.slice(0, -1), { ...lastItem, output: createResult.message }];
          }
          return [...prev, { id: uniqueId(), output: createResult.message }];
        });
        if (createResult.pda) {
          setConversationState(prev => ({ ...prev, phase: 'waitingForJoinResponse', currentPDA: createResult.pda }));
        } else {
          setConversationState(prev => ({ ...prev, phase: 'idle' }));
        }
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
            id: uniqueId(),
            output: `Error: ${error instanceof Error ? error.message : 'Failed to process command'}`
          }
        ];
      });
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