import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Pure black to cover any grey
  },
  asciiArt: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'left',
    fontSize: 12,
    color: '#00ff00',
    lineHeight: 14, // Better ASCII spacing
  },
  bonkAscii: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'left',
    fontSize: 8,
    color: '#FFFF00',
    lineHeight: 14,
  },
  sendBonkTxt: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 15,
    color: '#FFFF00',
  },
  welcome: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    color: '#FFFF00',
    padding: 2,
    fontSize: 16,
  },
  welcomeMenu: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    color: '#fff',
    borderColor: '#fff',
    borderWidth: 1,
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginTop: 32,
  },
  history: {
    flex: 1,
    backgroundColor: '#000', // Ensure no grey in history area
  },
  historyContent: {
    padding: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    borderWidth: 1, // Moved border here for full enclosure
    borderColor: '#0f0',
    borderRadius: 4,
    paddingHorizontal: 5, // Tighter padding to fill borders
    paddingVertical: 4,
    width: '100%', // Full width
    marginTop: 20, // Add space above the input
    marginBottom: 30, // Keep bottom margin for keyboard
    marginHorizontal: 0,
  },
  promptText: {
    color: '#0f0',
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
    fontSize: 16,
    marginRight: 5,
  },
  input: {
    flex: 1,
    color: '#0f0',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 16,
    padding: 4, // Small padding for text breathing room
    backgroundColor: 'transparent', // Let wrapper's black show through
    margin: 0, // No margins to fill fully
    // Custom cursor properties
    textShadowColor: '#0f0',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    // For Android
    textAlignVertical: 'center',
    includeFontPadding: false,
    // For iOS
    lineHeight: 20,
  },
  inputText: {
    color: '#0f0',
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
    fontWeight: 'bold',
    fontSize: 16,
    marginVertical: 2,
  },
  outputText: {
    color: '#ccc',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 16,
    marginVertical: 2,
  },
  messageText: {
    color: '#1e90ff',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 16,
    marginVertical: 2,
  },
  prompt: {
    color: '#FFFF00',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  selectedText: {
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    borderRadius: 4,
    padding: 2,
  },
  copyFeedback: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 5,
    borderRadius: 4,
    color: '#fff',
    fontSize: 12,
  },
  // PDA display styles
  serverFoundContainer: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: 'rgba(0, 100, 0, 0.1)',
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: '#0f0',
  },
  pdaContainer: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: 'rgba(0, 50, 0, 0.2)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#0f0',
  },
  pdaLabel: {
    color: '#0f0',
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
    fontSize: 14,
    marginBottom: 5,
  },
  pdaTouchable: {
    padding: 8,
    backgroundColor: 'rgba(0, 50, 0, 0.3)',
    borderRadius: 4,
  },
  pdaText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#0f0',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

export default styles;