import { bonkAscii, solChat } from "@/assets/ascii";
import { AppPage } from "@/components/app-page";
import { AppText } from "@/components/app-text";
import IQ from "@/components/iq";
import { sendBonk } from '@/components/solana/send-bonk';
import { useConnection } from "@/components/solana/solana-provider";
import { useWalletUi } from "@/components/solana/use-wallet-ui";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Clipboard from "@react-native-clipboard/clipboard";
import { Connection, Transaction, VersionedTransaction } from "@solana/web3.js";
import { decodeWithPassword, encodeWithPassword } from "hanlock";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { pdaCheck } from "./helper";
import { CommandResult, HistoryItem } from "./interface";
import styles from "./styles";

// Define your network (e.g., 'devnet', 'mainnet-beta', or a custom RPC URL)
const WELCOME_MESSAGE = `*Welcome to Solchat!*`;
const WELCOME_MENU = `[1] Create/Search my rooms \n[2] Enter friend's room\n[3] Enter Playground`;
const SELECT_MESSAGE = `\nType your selection:`;
const handleChatServerAction = async (
  connection: Connection,
  serverId: string | null,
  pubkey: string | null
): Promise<{
  message: string;
  pda?: string;
  type?: string;
  joinPrompt?: string;
}> => {
  try {
    IQ.userInit();
    const iqHost =
      "https://iq-testbackend-381334931214.asia-northeast3.run.app";
    const response = await fetch(
      `${iqHost}/get-server-pda/${pubkey}/${serverId}`
    );
    if (!response.ok) {
      if (response.status === 500) {
        return { message: "Error: PDA not found" };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data && data.PDA) {
      console.log(`Fetched PDA: ${data.PDA}`);
      try {
        const pdaCheckResult = await pdaCheck(connection, data.PDA);
        if (pdaCheckResult) {
          console.log("PDA found and validated");
          return {
            message: `Server found!`,
            pda: data.PDA,
            joinPrompt: `Join server? [y/n]`,
          };
        } else {
          console.log(
            "PDA check returned null/undefined, server may not exist yet"
          );
          return {
            message:
              "Server not found. Would you like to create a new server? [y/n]",
            pda: data.PDA, // Still return the PDA as we'll need it for creation
          };
        }
      } catch (error) {
        console.error("Error during PDA check:", error);
        return {
          message:
            "Error verifying server. The server may not exist yet. Would you like to create it? [y/n]",
          pda: data.PDA, // Still return the PDA as we'll need it for creation
        };
      }
    } else {
      return { message: "Error: could not find PDA from backend service" };
    }
  } catch (error) {
    console.error("API call failed:", error);
    return {
      message:
        "API Error: " +
        (error instanceof Error ? error.message : "Unknown error occurred"),
    };
  }
};
// Handle joining a chat server
const handleJoinChatServer = async (
  connection: Connection,
  pda: string,
  onNewMessage: (msg: string) => void
): Promise<{ message: string; subscriptionId: number | null }> => {
  console.log(`DEBUG: joining server with PDA: ${pda}`);
  try {
    // Determine how many historical messages are available
    const sigs = await IQ.fetchDataSignatures(connection, pda, 100);
    const totalMessages = sigs.length;
    const messagesToLoad = 4;
    const startIdx = Math.max(0, totalMessages - messagesToLoad);
    const loadingBanner =
      totalMessages > 1
        ? `[Server] Loading last ${messagesToLoad} messages (${
            startIdx + 1
          }/${totalMessages})...`
        : `[Server] No messages in this server yet.`;
    onNewMessage(loadingBanner);
    await IQ.getChatRecords(connection, pda, messagesToLoad, onNewMessage);
    const subscriptionId = await IQ.joinChat(connection, pda, onNewMessage);
    return {
      message: "Joined server successfully. Listening for messages...",
      subscriptionId,
    };
  } catch (error) {
    console.error("Failed to join chat:", error);
    return { message: "Error joining server.", subscriptionId: null };
  }
};
const handleCreateChatServer = async (
  connection: Connection,
  serverId: string,
  pubkey: string | null,
  signAndSendTransaction: (
    tx: Transaction | VersionedTransaction,
    minContextSlot?: number
  ) => Promise<string>
): Promise<{ message: string; pda?: string; joinPrompt?: string }> => {
  try {
    if (!pubkey) throw new Error("No pubkey available");
    const userKeyString = pubkey;
    const PDA = await IQ.getServerPDA(userKeyString, serverId);
    const isPDAExist = await pdaCheck(connection, PDA);
    if (isPDAExist) {
      return {
        message: `Server already exists.`,
        pda: PDA,
        joinPrompt: `Join server? [y/n]`,
      };
    }
    const transactionData = await IQ.createServerInitTransactionOnServer(
      userKeyString,
      "group_chat",
      serverId,
      "public"
    );
    if (transactionData) {
      const tx = await IQ._translate_transaction(transactionData);
      const txid = await IQ.appTxSend(tx, signAndSendTransaction);
      if (txid !== "null") {
        console.log(`Server created. TX: ${txid}`);
        return {
          message: `Server created successfully.`,
          pda: PDA,
          joinPrompt: `Join server? [y/n]`,
        };
      } else {
        return { message: "Transaction send failed." };
      }
    } else {
      return { message: "Transaction build failed." };
    }
  } catch (error) {
    console.error("Create server failed:", error);
    return {
      message: `Error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
};
// Helper to generate unique IDs for history items
const uniqueId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
// Command processing logic
const processCommand = async (
  connection: Connection,
  command: string,
  pubkey: string | null,
  phase: string,
  currentPDA?: string | null,
  nickname?: string | null,
  messagePw?: string | null
): Promise<CommandResult> => {
  const cmd = command.trim().toLowerCase();
  // Always allow /clear and /help commands
  if (cmd === "/clear") {
    return { clear: true };
  }
  if (cmd === "/help") {
    const helpText = [
      "Available commands:",
      "/clear - Clear the screen (shows main menu if in chat)",
      "/color [blue|red|green] - Change message color",
      "/pw [key] - Set decryption key for messages",
      "/sendbonk [address] [amount] - Send BONK to another user",
      "/leave - Exit the current chat room",
      "/help - Show this help message",
    ];
    return { output: helpText.join("\n") };
  }
  if (cmd === "") return {};
  if (phase === "inChat") {
    // handle slash commands
    if (cmd.startsWith("/color ")) {
      const colorArg = cmd.split(" ")[1];
      let hex = "#1e90ff";
      switch (colorArg) {
        case "blue":
          hex = "#1e90ff";
          break;
        case "red":
          hex = "#ff4500";
          break;
        case "green":
          hex = "#32cd32";
          break;
        default:
          return { output: "Supported colors: blue, red, green" };
      }
      return {
        output: `Message color changed to ${colorArg}.`,
        serverMessageColor: hex,
      };
    }
    if (cmd.startsWith("/pw ")) {
      const pwArg = cmd.replace(/^\/pw\s+/, "").trim();

      // Handle /pw off - clear encryption
      if (pwArg.toLowerCase() === "off") {
        return {
          output: "Encryption disabled. Messages will be sent in plaintext.",
          password: "", // Empty string will clear encryption
        };
      }

      // Handle empty key
      if (!pwArg) {
        return {
          output:
            "Usage:\n/pw <key> - Set decryption key\n/pw off - Disable encryption",
        };
      }

      // Set new encryption key
      return {
        output: "Decryption key updated. Reprocessing messages...",
        password: pwArg,
      };
    }
    if (cmd.startsWith("/sendbonk ")) {
      const address = cmd.split(" ")[1];
      const amountStr = cmd.split(" ")[2];
      const amount = Number(amountStr);
      await sendBonk(connection, amount, address);

      return {
        output: `Sent ${amount} Bonk to user ${address}`,
        amount: amount,
      };
    }
    if (cmd === "exit" || cmd === "/leave") {
      return {
        output: "[Server] Disconnecting...",
        clear: true,
        isLeavingChat: true,
      };
    }
    if (messagePw) {
      command = encodeWithPassword(command, messagePw);
    }
    const success = await IQ.sendChat(
      currentPDA!,
      command,
      nickname ?? "anonymous"
    );
    if (success) {
      return {
        output: "[Sent]",
        transactionId: success, // Store transaction ID separately for copy functionality
      };
    } else {
      return { output: "Error sending message." };
    }
  }
  // handle ongoing phases first
  if (phase === "waitingForServerId") {
    const actionOutput = await handleChatServerAction(connection, cmd, pubkey); // cmd is the serverId
    if (
      actionOutput.message.startsWith("Error:") ||
      actionOutput.message.startsWith("API Error:")
    ) {
      return { output: `${actionOutput.message}\nType your selection:` };
    }
    return {
      output: actionOutput.message,
      pda: actionOutput.pda,
      joinPrompt: actionOutput.joinPrompt,
    };
  }
  if (phase === "waitingForJoinResponse") {
    if (cmd === "y" || cmd === "yes") {
      if (!currentPDA) {
        return { output: "Error: No PDA available for joining." };
      }
      return { output: "[*] Preparing to join...", joined: true };
    } else if (cmd === "n" || cmd === "no") {
      return {
        output: [WELCOME_MESSAGE].join("\n"),
        type: "welcome",
        clear: true,
      };
    } else {
      return { output: "Please enter y or n:" };
    }
  }
  if (phase === "waitingForCreateResponse") {
    if (cmd === "y" || cmd === "yes") {
      return { output: "[*] Preparing to create server...", created: true };
    } else if (cmd === "n" || cmd === "no") {
      return { output: WELCOME_MESSAGE, type: "welcome", clear: true };
    } else {
      return { output: "Please enter y or n:" };
    }
  }
  if (phase === "waitingForHandle") {
    if (cmd.length === 0) return { output: "Nickname cannot be empty:" };
    return {
      output: `Nickname set to ${cmd}.\n\nEnable encryption? [y/n]`,
      nickname: cmd,
    };
  }
  if (phase === "waitingForPdaInput") {
    return {
      output: "Joining the server:" + cmd,
    };
  }
  switch (cmd) {
    case "clear":
      return { clear: true };
    case "help":
      return {
        output: [
          "Available commands:",
          "1 - Create or search chat server",
          "2 - Enter chat room",
          "clear - Clear screen",
          "help - Show this message",
        ].join("\n"),
      };
    case "1":
      return { output: "Enter Server Alias:" };
    case "2":
      return { output: "Enter PDA:" };
    //TODO: make the error message when user do any on-chain action without the gas fee.
    default:
      if (cmd.startsWith("echo ")) {
        return { output: cmd.slice(5) };
      }
      return {
        output: `Command not recognized. Type /help to see available commands.`,
      };
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
    setCopyFeedback("Copied!");
    setTimeout(() => setCopyFeedback(null), 2000);
  };
  const handleCopyAll = () => {
    const text = history
      .map((item) => [item.input, item.output].filter(Boolean).join("\n"))
      .filter(Boolean)
      .join("\n");
    Clipboard.setString(text);
  };
  const renderHistoryItem = ({ item }: { item: HistoryItem }) => {
    // ascii render
    if (item.type === "ascii") {
      return (
        <Text key={item.id} style={styles.asciiArt}>
          {item.output}
        </Text>
      );
    } else if (item.type === "welcome") {
      return (
        <Text key={item.id} style={styles.welcome}>
          {item.output}
        </Text>
      );
    } else if (item.type === "welcome_menu") {
      return (
        <Text key={item.id} style={styles.welcomeMenu}>
          {item.output}
        </Text>
      );
    } else if (item.type === "bonk") {
      return (
        <View key={item.id}>
          <Text style={styles.bonkAscii}>{bonkAscii}</Text>
          <Text style={styles.sendBonkTxt}>{item.output}</Text>
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
                selectedItem === item.input && styles.selectedText,
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
                item.output.startsWith("[Message]")
                  ? [styles.messageText, { color: messageColor }]
                  : item.output.startsWith("[Server]")
                  ? styles.prompt
                  : styles.outputText,
                selectedItem === item.output && styles.selectedText,
                // NEW: Optional styling for PDA to make it stand out as tappable
                (item.type === "pda" || item.type === "txid") && {
                  textDecorationLine: "underline",
                  fontWeight: "bold",
                  color: "#0f0",
                },
              ]}
            >
              {item.output}
            </AppText>
          </TouchableOpacity>
        )}
        {copyFeedback &&
          selectedItem &&
          (item.input === selectedItem || item.output === selectedItem) && (
            <Text style={styles.copyFeedback}>{copyFeedback}</Text>
          )}
      </View>
    );
  };
  return (
    <View style={styles.container}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
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
    if (phase === "waitingForServerId") return "Server ID:";
    if (phase === "inChat") return "Type message...";
    return "Enter command...";
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
    phase:
      | "idle"
      | "waitingForServerId"
      | "waitingForJoinResponse"
      | "inChat"
      | "waitingForCreateResponse"
      | "waitingForHandle"
      | "waitingForPdaInput"
      | "waitingForEncryptionResponse"
      | "waitingForEncryptionKey"
      | "playground";
    pendingPubkey?: string | null;
    currentPDA?: string | null;
    currentServerId?: string;
    nickname?: string | null;
  }>({
    phase: "idle",
  });
  const connection = useConnection();
  const subscriptionRef = useRef<number | null>(null);
  const [command, setCommand] = useState<string>("");
  const { publicKey, signAndSendTransaction, isUserInitialized } =
    useWalletUi();
  const [pubkey, setPubkey] = useState<string | null>(null);
  useEffect(() => {
    setPubkey(publicKey?.toBase58() ?? null);
  }, [publicKey]);
  const [messageColor, setMessageColor] = useState<string>("#1e90ff");
  const [messagePw, setMessagePW] = useState<string>("");
  const messagePwRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSentTxid, setLastSentTxid] = useState<string | null>(null);
  // Load saved encryption key on mount
  useEffect(() => {
    const loadEncryptionKey = async () => {
      try {
        const savedKey = await AsyncStorage.getItem("@solchat:encryptionKey");
        if (savedKey) {
          setMessagePW(savedKey);
          messagePwRef.current = savedKey;
        }
      } catch (e) {
        console.error("Failed to load encryption key", e);
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
          await AsyncStorage.setItem("@solchat:encryptionKey", messagePw);
        } catch (e) {
          console.error("Failed to save encryption key", e);
        }
      }
    };
    saveEncryptionKey();
    messagePwRef.current = messagePw;
  }, [messagePw]);
  const [history, setHistory] = useState<HistoryItem[]>([
    { id: "solchat", output: solChat, type: "ascii" },
    { id: "welcome", output: WELCOME_MESSAGE, type: "welcome" },
    { id: "welcome_menu", output: WELCOME_MENU, type: "welcome_menu" },
    { id: "select_message", output: SELECT_MESSAGE, type: "select_message" },
  ]);
const flatListRef = useRef<FlatList<HistoryItem>>(null);
const handleJoinChatServerWrapper = async (
  connection: Connection,
  pda: string,
  onNewMessage: (msg: string) => void
): Promise<{ message: string; subscriptionId: number | null }> => {
  // Clean up any existing subscription before joining a new one
  if (subscriptionRef.current !== null) {
    try {
      await connection.removeOnLogsListener(subscriptionRef.current);
      console.log('Previous chat listener cleaned up');
    } catch (err) {
      console.error('Failed to remove previous logs listener:', err);
    }
    subscriptionRef.current = null;
  }
  setConversationState(prev => ({ ...prev, phase: 'waitingForJoinResponse' }));
  // Ensure UI updates before showing loading state
  await new Promise(resolve => setTimeout(resolve, 50));
  try {
    // Call the imported handleJoinChatServer function from the top of the file
    const result = await handleJoinChatServer(connection, pda, onNewMessage);
    // Optionally, implement auto-reconnect logic if subscription drops (advanced: needs hooks into IQ.joinChat)
    return result;
  } catch (error) {
    console.error('Error joining chat server:', error);
    return { message: 'Failed to join chat server. Please try again.', subscriptionId: null };
  }
};
const handleCreateChatServerWrapper = async (connection: Connection, serverId: string, pubkey: string | null, signAndSendTransaction: (tx: Transaction | VersionedTransaction) => Promise<string>): Promise<{ message: string; pda?: string; joinPrompt?: string }> => {
setConversationState(prev => ({ ...prev, phase: 'waitingForCreateResponse' }));
// Ensure UI updates before showing loading state
await new Promise(resolve => setTimeout(resolve, 50));
try {
// Call the imported handleCreateChatServer function from the top of the file
const result = await handleCreateChatServer(connection,serverId, pubkey, signAndSendTransaction);
return result;
    } catch (error) {
      console.error("Error creating chat server:", error);
      return {
        message: "Failed to create chat server. Please try again.",
        pda: undefined,
      };
    }
  };
  const handleSetNickname = (nickname: string) => {
    setConversationState((prev) => ({
      ...prev,
      nickname,
      phase: "waitingForEncryptionResponse",
    }));
    // Small delay to ensure state updates before scrolling
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return {
      output: `Nickname set to: ${nickname}\n\nEnable end-to-end encryption? (y/n)`,
    };
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
    const isSystemMessage = msg.startsWith("[") || msg.startsWith(">");
    const shouldDecrypt =
      messagePwRef.current && msg.includes(": ") && !isSystemMessage;
    let processedMsg = msg;
    let decrypted = false;
    if (shouldDecrypt && messagePwRef.current) {
      try {
        const [handle, encrypted] = msg.split(": ");
        if (encrypted) {
          const decryptedContent = decodeWithPassword(
            encrypted,
            messagePwRef.current
          );
          processedMsg = `${handle}: ${decryptedContent}`;
          decrypted = true;
        }
      } catch (e) {
        if (e instanceof Error && !e.message.includes("Invalid character")) {
          console.log("Unable to decrypt message:", e);
        }
      }
    }

    const processedOutput = isSystemMessage ? processedMsg : `[Chat] ${processedMsg}`;

    const hashCode = (str: string) => {
    let hash = 0, i, chr;
  if (str.length === 0) return hash;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};
const msgHash = hashCode(processedOutput);
const dedupWindowMs = 30000; // 30 seconds
setHistory(prev => {
  const now = Date.now();
  const isDuplicate = prev.some(item =>
    item.output && hashCode(item.output) === msgHash &&
    item.timestamp && (now - item.timestamp) < dedupWindowMs
  );
  if (isDuplicate) {
    return prev;
  }
  return [
    ...prev,
    {
      id: uniqueId(),
      output: processedOutput,
      type: decrypted ? 'decrypted' : undefined,
      timestamp: now
    }
  ];
});
};
useEffect(() => {
  if (conversationState.phase === 'idle') {
    setHistory([
      { id: 'solchat', output: solChat, type: 'ascii' },
      { id: 'welcome', output: WELCOME_MESSAGE, type: 'welcome' },
      { id: 'welcome_menu', output: WELCOME_MENU, type: 'welcome_menu' },
      { id: 'select_message', output: SELECT_MESSAGE, type: 'select_message' }
    ]);
  }
}, [conversationState.phase]);

useEffect(() => {
  return () => {
    if (subscriptionRef.current !== null) {
      (async () => {
try {
await connection.removeOnLogsListener(subscriptionRef.current!);
console.log('Chat listener cleaned up');
        } catch (err) {
console.error(' Failed to remove logs listener:', err);
        }
      })();
subscriptionRef.current = null;
    }
  };
}, []);
const handleCommandSubmit = async () => {
const lowerCmd = command.trim().toLowerCase();
// Auto-scroll when command is submitted
setTimeout(() => {
flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    // if user is not initialized, block actions
    if (isUserInitialized === false) {
      const restrictedPhases = [
        "idle",
        "waitingForServerId",
        "waitingForJoinResponse",
        "waitingForCreateResponse",
        "waitingForPdaInput",
      ];
      const wantsRestricted =
        (conversationState.phase === "idle" &&
          (lowerCmd === "1" || lowerCmd === "2")) ||
        restrictedPhases.includes(conversationState.phase as string);
      if (wantsRestricted) {
        setHistory((prev) => [
          ...prev,
          {
            id: uniqueId(),
            output:
              "[Server] Wallet not initialized. Please airdrop SOL to your wallet and reconnect before creating or joining a chatroom.",
          },
        ]);
        setCommand("");
        return;
      }
    }
    if (command.trim() === "") return;
    const newEntry: HistoryItem = { id: uniqueId(), input: `> ${command}` };
    setHistory((prevHistory) => [
      ...prevHistory,
      newEntry,
      { id: uniqueId(), output: "Loading..." },
    ]);
    // Playground phase: handle exit/leave commands directly
    if (conversationState.phase === "playground") {
      const lowerCmd = command.trim().toLowerCase();
      if (["/exit", "/leave", "/menu"].includes(lowerCmd)) {
        setHistory([
          { id: uniqueId(), output: solChat, type: "ascii" },
          { id: uniqueId(), output: WELCOME_MESSAGE, type: "welcome" },
          { id: uniqueId(), output: WELCOME_MENU, type: "welcome_menu" },
          { id: uniqueId(), output: SELECT_MESSAGE, type: "select_message" },
        ]);
        setConversationState((prev) => ({ ...prev, phase: "idle" }));
        setCommand("");
        return;
      }
      // All other commands in Playground: echo test response
      setHistory((prev) => [
        ...prev,
        { id: uniqueId(), input: `> ${command}` },
        { id: uniqueId(), output: `[Degen] This is a test environment. No backend actions will be performed.`, type: "degen" },
      ]);
      setCommand("");
      return;
    }
    try {
      const result = await processCommand(
        connection,
        command,
        pubkey,
        conversationState.phase,
        conversationState.currentPDA,
        conversationState.nickname,
        messagePw
      );
      if (result.clear) {
        // handle /leave command - show disconnecting and clear to welcome screen
        if (result.isLeavingChat && conversationState.phase === "inChat") {
          // unsubscribe from chat if needed
          if (subscriptionRef.current !== null) {
            await connection.removeOnLogsListener(subscriptionRef.current);
            subscriptionRef.current = null;
          }
          // show disconnecting message briefly
          setHistory([
            {
              id: uniqueId(),
              output: result.output || "[Server] Disconnecting...",
            },
          ]);
          // short delay before clearing to welcome screen
          setTimeout(() => {
            setHistory([
              { id: uniqueId(), output: solChat, type: "ascii" },
              { id: uniqueId(), output: WELCOME_MESSAGE, type: "welcome" },
              { id: uniqueId(), output: WELCOME_MENU, type: "welcome_menu" },
              {
                id: uniqueId(),
                output: SELECT_MESSAGE,
                type: "select_message",
              },
            ]);
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 500);
          setConversationState((prev) => ({
            ...prev,
            phase: "idle",
            currentPDA: null,
          }));
        }
        // handle /clear command - just clear the screen
        else {
          setHistory([]);
          if (conversationState.phase !== "inChat") {
            setTimeout(() => {
              setHistory([
                { id: uniqueId(), output: solChat, type: "ascii" },
                { id: uniqueId(), output: WELCOME_MESSAGE, type: "welcome" },
                { id: uniqueId(), output: WELCOME_MENU, type: "welcome_menu" },
                {
                  id: uniqueId(),
                  output: SELECT_MESSAGE,
                  type: "select_message",
                },
              ]);
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 500);
            setConversationState((prev) => ({
              ...prev,
              phase: "idle",
              currentPDA: null,
            }));
          }
        }
        setMessageColor("#1e90ff");
        setCommand("");
        setMessagePW("");
        messagePwRef.current = null;
        return;
      }
      if (result.serverMessageColor) {
        setMessageColor(result.serverMessageColor);
      }
      if (result.password !== undefined) {
        // First set the password
        setMessagePW(result.password);
        // Create decrypted versions of existing messages and append them
        setHistory((prevHistory) => {
          const newEntries: HistoryItem[] = [];
          // Keep all original messages
          const updatedHistory = [...prevHistory];
          // Find and add decrypted versions of encrypted messages
          prevHistory.forEach((msg) => {
            if (msg.output && msg.output.includes(": ")) {
              const [handle, encrypted] = msg.output.split(": ");
              try {
                const decrypted = decodeWithPassword(
                  encrypted,
                  result.password!
                );
                // Only add if decryption was successful and different from original
                const isValidText = (text: string) =>
                  /^[\x20-\x7E]*$/.test(text); // Printable ASCII range (space to ~)
                if (decrypted !== encrypted && isValidText(decrypted)) {
                  // Only add if valid and changed
                  newEntries.push({
                    id: `${msg.id}-decrypted`,
                    output: `[Decrypted] ${handle}: ${decrypted}`,
                    type: "decrypted",
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
      if (result.amount) {
        setHistory((prev) => [
          ...prev,
          { id: uniqueId(), output: result.output, type: "bonk" },
        ]);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
        setCommand("");
        return;
      }
      if (result.nickname) {
        setHistory((prev) => {
          const filtered = prev.filter((item) => item.id !== "loading");
          return [
            ...filtered,
            {
              id: uniqueId(),
              output: result.output ?? `Nickname set to ${result.nickname}.`,
            },
          ];
        });
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
        setCommand("");
        // Move to encryption prompt phase
        setConversationState((prev) => ({
          ...prev,
          phase: "waitingForEncryptionResponse",
          nickname: result.nickname,
        }));
        return;
      }
      // Handle encryption response (yes/no)
      if (conversationState.phase === "waitingForEncryptionResponse") {
        setHistory((prev) => {
          const filtered = prev.filter((item) => item.id !== "loading");
          const response = command.trim().toLowerCase();
          let newOutput = "";
          if (response === "y") {
            newOutput =
              "Enter hanlock encryption key (Korean, 3-10 characters):";
            // Move to encryption key input phase
            setConversationState((prev) => ({
              ...prev,
              phase: "waitingForEncryptionKey",
            }));
          } else {
            newOutput =
              "Starting chat without encryption.\n/pw <key> to enable encryption\n/pw off to disable encryption\n/leave to disconnect.\nHappy Chatting!";
            // Clear any existing encryption key
            setMessagePW("");
            messagePwRef.current = null;
            // Move to chat phase without encryption
            setConversationState((prev) => ({
              ...prev,
              phase: "inChat",
            }));
          }
          return [...filtered, { id: uniqueId(), output: newOutput }];
        });
        setCommand("");
        return;
      }
      // Handle encryption key input
      if (conversationState.phase === "waitingForEncryptionKey") {
        const key = command.trim();
        if (key.length === 0) {
          setHistory((prev) => [
            ...prev.filter((item) => item.id !== "loading"),
            {
              id: uniqueId(),
              output: "Encryption key cannot be empty. Please enter a key:",
            },
          ]);
          return;
        }
        setHistory((prev) => {
          const filtered = prev.filter((item) => item.id !== "loading");
          return [
            ...filtered,
            {
              id: uniqueId(),
              output: `Encryption enabled with key.\n/pw <key> to change encryption key.\n/leave to disconnect.\nHappy Chatting!`,
            },
          ];
        });
        setMessagePW(key);
        setCommand("");
        setConversationState((prev) => ({
          ...prev,
          phase: "inChat",
        }));
        return;
      }
      // Update history with the result, handling different result types
      setHistory((prevHistory) => {
        const filtered = prevHistory.filter((item) => item.id !== "loading");
        const newItems: HistoryItem[] = [];
        // Add the main output if it exists
        if (result.output) {
          newItems.push({ id: uniqueId(), output: result.output });
        }
        // Add transaction ID as a separate copyable item if it exists
        if (result.transactionId) {
          newItems.push({
            id: uniqueId(),
            output: result.transactionId,
            type: "txid", // Use 'txid' type for transaction IDs
          });
        }
        // Add PDA and join prompt if they exist
        if (result.pda && result.joinPrompt) {
          newItems.push(
            { id: uniqueId(), output: "PDA (share this to your friends):" },
            { id: uniqueId(), output: result.pda, type: "pda" },
            { id: uniqueId(), output: result.joinPrompt }
          );
        }
        return [...filtered, ...newItems];
      });
      // Clear the command input
      setCommand("");
      // Ensure we're not stuck in a loading state
      if (conversationState.phase === "waitingForServerId" && result.pda) {
        // If we have a PDA but no output, we might be stuck
        if (!result.output) {
          setHistory((prev) => [
            ...prev.filter((item) => item.id !== "loading"),
            {
              id: uniqueId(),
              output: `Server found!`,
            },
            {
              id: uniqueId(),
              output: "PDA (share this to your friends):",
            },
            {
              id: uniqueId(),
              output: result.pda,
              type: "pda",
            },
            {
              id: uniqueId(),
              output: "Join server? [y/n]",
            },
          ]);
          setConversationState((prev) => ({
            ...prev,
            phase: "waitingForJoinResponse",
            currentPDA: result.pda,
            pendingPubkey: pubkey,
          }));
          return;
        }
      }
      // update conversation state based on command
      const cmd = command.trim().toLowerCase();
      if (cmd === "1" && conversationState.phase === "idle") {
        setConversationState((prev) => ({
          ...prev,
          phase: "waitingForServerId",
          pendingPubkey: pubkey,
        }));
      } else if (conversationState.phase === "waitingForServerId") {
        // check if output contains the join prompt
        if (result.output && result.joinPrompt) {
          setConversationState((prev) => ({
            ...prev,
            phase: "waitingForJoinResponse",
            pendingPubkey: pubkey,
            currentPDA: result.pda || prev.currentPDA, // Use result.pda if available
          }));
        } else if (
          result.output &&
          result.output.includes("create a new server? [y/n]")
        ) {
          setConversationState((prev) => ({
            ...prev,
            phase: "waitingForCreateResponse",
            currentServerId: command.trim(),
          }));
        } else {
          setConversationState((prev) => ({ ...prev, phase: "idle" }));
        }
      } else if (conversationState.phase === "waitingForCreateResponse") {
        if (cmd === "n" || cmd === "no") {
          // User chose not to create a server, return to main menu
          setHistory((prev) => [
            ...prev.filter((item) => item.id !== "loading"),
            { id: uniqueId(), output: WELCOME_MESSAGE, type: "welcome" },
            { id: uniqueId(), output: WELCOME_MENU, type: "welcome_menu" },
          ]);
          setConversationState((prev) => ({
            ...prev,
            phase: "idle",
            currentServerId: undefined,
          }));
          return;
        } else if (cmd === "y" || cmd === "yes") {
          // Handle server creation confirmation
          if (conversationState.currentServerId && pubkey) {
            const createResult = await handleCreateChatServerWrapper(
              connection,
              conversationState.currentServerId,
              pubkey,
              signAndSendTransaction
            );
            if (createResult.pda) {
              setConversationState((prev) => ({
                ...prev,
                phase: "waitingForJoinResponse",
                currentPDA: createResult.pda,
              }));
              setHistory((prev) => [
                ...prev.filter((item) => item.id !== "loading"),
                {
                  id: uniqueId(),
                  output:
                    createResult.message || "Server created successfully!",
                },
                { id: uniqueId(), output: "PDA (share this to your friends):" },
                { id: uniqueId(), output: createResult.pda, type: "pda" },
                {
                  id: uniqueId(),
                  output: createResult.joinPrompt || "Join server? [y/n]",
                },
              ]);
            } else {
              setHistory((prev) => [
                ...prev.filter((item) => item.id !== "loading"),
                {
                  id: uniqueId(),
                  output:
                    createResult.message ||
                    "Failed to create server. Please try again.",
                },
              ]);
              setConversationState((prev) => ({ ...prev, phase: "idle" }));
            }
          }
        }
      } else if (conversationState.phase === "waitingForJoinResponse") {
        if (!result.joined) {
          setConversationState((prev) => ({ ...prev, phase: "idle" }));
        }
      }
      if (cmd === "2" && conversationState.phase === "idle") {
        // Enter chat room
        setConversationState((prev) => ({
          ...prev,
          phase: "waitingForPdaInput",
        }));
      } else if (cmd === "3" && conversationState.phase === "idle") {
        // Enter Playground (Degen mode)
        setConversationState((prev) => ({ ...prev, phase: "playground" }));
        const DEGEN_ASCII = `
   _____                   
  |  __ \\                  
  | |  | | ___  ___  ___   
  | |  | |/ _ \\/ __|/ _ \\  
  | |__| |  __/\\__ \\  __/  
  |_____/ \\___||___/\\___|  
`;
        const DEGEN_WELCOME = "*You are now in Degen mode.*";
        setHistory([
          { id: "degen_ascii", output: DEGEN_ASCII, type: "ascii" },
          { id: "degen_welcome", output: DEGEN_WELCOME, type: "welcome" },
          { id: "degen_help", output: "Welcome to the Playground!\\nThis is a blank slate for you to test commands and features in isolation.\\nType any command below, or explore freely.", type: "welcome_menu" },
        ]);
        setCommand("");
        return;
      } else if (conversationState.phase === "playground") {
        if (cmd === "/exit" || cmd === "/leave") {
          setConversationState((prev) => ({ ...prev, phase: "idle" }));
          setHistory([
            { id: uniqueId(), output: WELCOME_MESSAGE, type: "welcome" },
            { id: uniqueId(), output: WELCOME_MENU, type: "welcome_menu" },
          ]);
          return;
        }
      } else if (conversationState.phase === "waitingForPdaInput") {
        const pda = command.trim();
        const { message: joinOutput, subscriptionId } =
          await handleJoinChatServerWrapper(connection, pda, onNewMessage);
        subscriptionRef.current = subscriptionId;
        setHistory((prev) => [
          ...prev,
          { id: uniqueId(), output: joinOutput },
          { id: uniqueId(), output: "Choose a nickname:" },
        ]);
        setConversationState((prev) => ({
          ...prev,
          phase: "waitingForHandle",
          currentPDA: pda,
        }));
        return;
      }
      if (result.joined && conversationState.currentPDA) {
        const { message: joinOutput, subscriptionId } =
          await handleJoinChatServerWrapper(
            connection,
            conversationState.currentPDA,
            onNewMessage
          );
        subscriptionRef.current = subscriptionId;
        setHistory((prev) => {
          const lastItem = prev[prev.length - 1];
          if (lastItem.output === "Preparing to join...") {
            // Replace dummy output
            return [
              ...prev.slice(0, -1),
              { ...lastItem, output: joinOutput, id: uniqueId() },
            ];
          }
          return [...prev, { id: uniqueId(), output: joinOutput }];
        });
        setHistory((prev) => [
          ...prev,
          { id: uniqueId(), output: "Choose a nickname:" },
        ]);
        setConversationState((prev) => ({
          ...prev,
          phase: "waitingForHandle",
        }));
      }
    } catch (error) {
      console.error("Error processing command:", error);
      setHistory((prev) => [
        ...prev,
        {
          id: uniqueId(),
          output: `Error: ${
            error instanceof Error ? error.message : "Failed to process command"
          }`,
        },
      ]);
      setConversationState((prev) => ({
        ...prev,
        phase: "idle",
        currentPDA: null,
      }));
    }
  };
  // Polling for wallet initialization if not initialized
  const [localIsUserInitialized, setLocalIsUserInitialized] =
    useState(isUserInitialized);
  useEffect(() => {
    setLocalIsUserInitialized(isUserInitialized);
  }, [isUserInitialized]);

  useEffect(() => {
    if (publicKey && !localIsUserInitialized) {
      const interval = setInterval(async () => {
        try {
          const balance = await connection.getBalance(publicKey);
          if (balance > 0) {
            setLocalIsUserInitialized(true);
            clearInterval(interval);
            // Optionally, add a message to history
            setHistory((prev) => [
              ...prev,
              {
                id: uniqueId(),
                output:
                  "[Server] Wallet funded and initialized! You can now create or join chatrooms.",
              },
            ]);
          }
        } catch (error) {
          console.error("Error checking wallet balance:", error);
        }
      }, 10000); // Poll every 10 seconds
      return () => clearInterval(interval);
    }
  }, [publicKey, localIsUserInitialized, connection, history]);

  return (
    <AppPage>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <CommandHistory
          history={history}
          flatListRef={flatListRef}
          messageColor={messageColor}
        />
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
