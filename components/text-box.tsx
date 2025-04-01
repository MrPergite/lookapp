import theme from "@/styles/theme";
import { useState } from "react";
import { View, TextInput, Text, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

export default function TextBox({ label, error, ...props }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TextInput
        {...props}
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: theme.colors.secondary.veryDarkGray,
    fontFamily: "default-medium",
  },
  input: {
    backgroundColor: theme.colors.primary.white,
    borderRadius: 10,
    padding: theme.spacing.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.secondary.black,
    fontFamily: "default-medium",
  },
  inputFocused: {
    borderColor: theme.colors.primary.periwinkle,
    backgroundColor: theme.colors.primary.white,
  },
  inputError: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginTop: 5,
    fontFamily: "default-semibold",
  },
});
