import React, { useState } from "react";
import {
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";

const ChatInput = ({}) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      setMessage(""); // Clear input
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.inputContainer}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          multiline
          style={styles.input}
          onSubmitEditing={handleSend}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    borderRadius: 20,
  },
});

export default ChatInput;
