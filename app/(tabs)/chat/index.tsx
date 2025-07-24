import React, { useEffect, useRef, useState } from 'react';
import { Button, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Type for messages
type Message = { id: string; text: string; sender: 'user' | 'system' };

const createOrEnterChatRoom = () => {
  
};

const ChatApp = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [promptingServerID, setPromptingServerID] = useState<boolean>(false);
  const [serverID, setServerID] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSendMessage = () => {
    if (input.trim() === '') return;
    const newMessage: Message = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages((prev) => [...prev, newMessage]);

    // Process as a regular message or command
    if (input.toLowerCase().startsWith('echo ')) {
      const echoText = input.slice(5);
      setMessages((prev) => [...prev, { id: Date.now().toString(), text: echoText, sender: 'system' }]);
    } 
    
    else if (input.toLowerCase() === 'help') {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), text: 'Available commands: echo <text>, Server ID button', sender: 'system' },
      ]);
    } 
    
    else if (input.toLowerCase() === '1') {
      createOrEnterChatRoom();
      // Handle unknown commands
      /*
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), text: `Unknown command: ${input}`, sender: 'system' },
      ]);
      */
    }
    
    else {
      // Handle unknown commands
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), text: `Unknown command: ${input}`, sender: 'system' },
      ]);
    }
    setInput('');
  };

  const handleServerIDCommand = () => {
    setPromptingServerID(true);
  };

  const handleServerIDSubmit = () => {
    if (serverID.trim() === '') return;
    const result = someFunction(serverID);
    setMessages((prev) => [...prev, { id: Date.now().toString(), text: result, sender: 'system' }]);
    setPromptingServerID(false);
    setServerID('');
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.message, item.sender === 'user' ? styles.userMessage : styles.systemMessage]}>
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messageList}
      />
      {promptingServerID ? (
        <View style={styles.inputContainer}>
          <Text style={styles.promptText}>Enter Server ID:</Text>
          <TextInput
            style={styles.input}
            value={serverID}
            onChangeText={setServerID}
            placeholder="Server ID"
            placeholderTextColor="#00FF00"
            onSubmitEditing={handleServerIDSubmit}
            autoFocus
          />
          <Button title="Submit Server ID" onPress={handleServerIDSubmit} color="#00FF00" />
          <Button title="Cancel" onPress={() => setPromptingServerID(false)} color="#00FF00" />
        </View>
      ) : (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message or command"
            placeholderTextColor="#00FF00"
            onSubmitEditing={handleSendMessage}
          />
          <Button title="Send" onPress={handleSendMessage} color="#00FF00" />
          <TouchableOpacity style={styles.commandButton} onPress={handleServerIDCommand}>
            <Text style={styles.commandButtonText}>Get Server ID</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Black background for Matrix vibe
  },
  messageList: {
    flex: 1,
    padding: 10,
  },
  message: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    maxWidth: '80%',
    opacity: 0.9, // Slight transparency for digital effect
  },
  userMessage: {
    backgroundColor: '#1B5E20', // Dark green for user messages
    alignSelf: 'flex-end',
  },
  systemMessage: {
    backgroundColor: '#0A1A0A', // Black with green tint for system messages
    alignSelf: 'flex-start',
  },
  messageText: {
    color: '#00FF00', // Neon green text
    fontFamily: 'monospace', // Terminal-like font
    fontSize: 14,
  },
  inputContainer: {
    padding: 10,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderColor: '#00FF00', // Green border for input area
  },
  input: {
    borderWidth: 1,
    borderColor: '#00FF00', // Green border
    color: '#00FF00', // Green text
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  promptText: {
    color: '#00FF00', // Neon green
    fontSize: 16,
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  commandButton: {
    backgroundColor: '#00FF00', // Neon green button
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1B5E20', // Darker green border
  },
  commandButtonText: {
    color: '#000', // Black text instead of white
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
});

export default ChatApp;