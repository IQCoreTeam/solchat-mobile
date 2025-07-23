import { AppPage } from '@/components/app-page';
import { AppText } from '@/components/app-text';
import React, { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';

// TypeScript interface for history items
interface HistoryItem {
  id: string;
  input?: string;
  output?: string;
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginTop: 32,
  },
  history: {
    flex: 1,
  },
  historyContent: {
    padding: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  prompt: {
    color: '#0f0',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 16,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 16,
    paddingVertical: 5,
  },
  inputText: {
    color: '#0f0',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 16,
    marginVertical: 2,
  },
  outputText: {
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 16,
    marginVertical: 2,
  },
});

// Command processing logic
const processCommand = (command: string): { output?: string; clear?: boolean } => {
  if (command.trim() === '') return {};

  switch (command.toLowerCase()) {
    case 'clear':
      return { clear: true };
    case 'help':
      return { output: 'Available commands: clear, help, echo <text>' };
    default:
      if (command.toLowerCase().startsWith('echo ')) {
        return { output: command.slice(5) };
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
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const flatListRef = useRef<FlatList<HistoryItem>>(null);

  const handleCommandSubmit = () => {
    if (command.trim() === '') return;

    const newEntry: HistoryItem = { id: Date.now().toString(), input: `> ${command}` };
    const result = processCommand(command);

    if (result.clear) {
      setHistory([]);
      setCommand('');
      return;
    }

    setHistory([...history, newEntry, { id: (Date.now() + 1).toString(), output: result.output }]);
    setCommand('');

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <AppPage>
      <AppText type="title" style={styles.title}>
        CLI Interface
      </AppText>
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