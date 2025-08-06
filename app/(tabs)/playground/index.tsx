import { AppPage } from "@/components/app-page";
import { AppText } from "@/components/app-text";
import React, { useRef, useState, useEffect } from "react";
import { FlatList, KeyboardAvoidingView, Platform } from "react-native";
import CommandHistory from "../chat/index";
import CommandInput from "../chat/index";
import styles from "../chat/styles";

const DEGEN_ASCII = `
   _____                   
  |  __ \                  
  | |  | | ___  ___  ___   
  | |  | |/ _ \/ __|/ _ \  
  | |__| |  __/\__ \  __/  
  |_____/ \___||___/\___|  
`;

const DEGEN_WELCOME = "*You are now in Degen mode.*";
const DEGEN_HELP = `Welcome to the Playground!\nThis is a blank slate for you to test commands and features in isolation.\nType any command below, or explore freely.`;

export default function PlaygroundScreen() {
  const [history, setHistory] = useState([
    { id: "degen_ascii", output: DEGEN_ASCII, type: "ascii" },
    { id: "degen_welcome", output: DEGEN_WELCOME, type: "welcome" },
    { id: "degen_help", output: DEGEN_HELP, type: "welcome_menu" },
  ] as { id: string; output?: string; input?: string; type?: string }[]);
  const [command, setCommand] = useState("");
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (flatListRef.current) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [history]);

  const handleCommandSubmit = () => {
    if (command.trim() === "") return;
    setHistory((prev) => [
      ...prev,
      { id: Date.now().toString(), input: `> ${command}` },
      { id: Date.now().toString() + "_resp", output: "[Degen] This is a test environment. No backend actions will be performed.", type: "degen" }
    ]);
    setCommand("");
  };

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
          messageColor={"#0f0"}
        />
        <CommandInput
          command={command}
          setCommand={setCommand}
          onSubmit={handleCommandSubmit}
          phase={"degen"}
        />
      </KeyboardAvoidingView>
    </AppPage>
  );
}
