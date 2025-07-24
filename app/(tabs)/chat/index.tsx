import { AppPage } from '@/components/app-page';
import { AppText } from '@/components/app-text';
import React, { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import styles from './styles';

// TypeScript interface for history items
interface HistoryItem {
  id: string;
  input?: string;
  output?: string;
}

// Simple test API call
const handleChatServerAction = async (): Promise<string> => {
  try {
    // A1BK8kJqG2o1uScbLjApMXBNzWGjoNjtpjaCkGQkdkY6
    // https://solanacontractapi.uc.r.appspot.com
    const url = "https://solanacontractapi.uc.r.appspot.com/getDBPDA/A1BK8kJqG2o1uScbLjApMXBNzWGjoNjtpjaCkGQkdkY6"
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 500) {
        return 'Error: DBPDA not found in response';
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data && data.DBPDA) {
      return `Fetched DBPDA: ${data.DBPDA}`;
    } else {
      return 'Error: DBPDA not found in response';
    }
  } catch (error) {
    console.error('API call failed:', error);
    return `API Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
  }
};

// Command processing logic
const processCommand = async (command: string): Promise<{ output?: string; clear?: boolean }> => {
  const cmd = command.trim().toLowerCase();

  if (cmd === '') return {};

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
      return { output: await handleChatServerAction() };
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
  const renderHistoryItem = ({ item }: { item: HistoryItem }) => (
    <View>
      {item.input && <AppText style={styles.inputText}>{item.input}</AppText>}
      {item.output && <AppText style={styles.outputText}>{item.output}</AppText>}
    </View>
  );

  return (
    <FlatList
      ref={flatListRef}
      data={history}
      renderItem={renderHistoryItem}
      keyExtractor={(item) => item.id}
      style={styles.history}
      contentContainerStyle={styles.historyContent}
    />
  );
};

// Component to render command input
const CommandInput: React.FC<{
  command: string;
  setCommand: (text: string) => void;
  onSubmit: () => void;
}> = ({ command, setCommand, onSubmit }) => (
  <View style={styles.inputContainer}>
    <AppText style={styles.prompt}>$ </AppText>
    <TextInput
      style={styles.input}
      value={command}
      onChangeText={setCommand}
      onSubmitEditing={onSubmit}
      placeholder="Enter command..."
      placeholderTextColor="#888"
      autoCapitalize="none"
      autoCorrect={false}
      returnKeyType="send"
    />
  </View>
);

// Main component
export default function TabSettingsScreen() {
  const [command, setCommand] = useState<string>('');
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
      const result = await processCommand(command);
      
      if (result.clear) {
        setHistory([]);
        setCommand('');
        return;
      }

      setHistory(prevHistory => [
        ...prevHistory,
        { id: (Date.now() + 1).toString(), output: result.output }
      ]);
      setCommand('');

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
        />
      </KeyboardAvoidingView>
    </AppPage>
  );
}