import theme from "@/styles/theme";
import React, { useState, forwardRef, ForwardRefRenderFunction } from "react";
import { View, TextInput, Text, StyleSheet, TextInputProps, TextStyle } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

interface TextBoxProps extends TextInputProps {
  label?: string;
  error?: string | null;
  labelStyle?: TextStyle;
}

const TextBox: ForwardRefRenderFunction<TextInput, TextBoxProps> = ({ label, error, style, ...props }, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { ...(props.labelStyle || {}) }]}>{label}</Text>}

      <TextInput
        {...props}
        ref={ref}
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          style
        ]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 15,
    paddingHorizontal: 0,
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
    width: "100%",
    alignSelf: "stretch",
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

// Add display name for better debugging
const ForwardedTextBox = forwardRef(TextBox);
ForwardedTextBox.displayName = 'TextBox';

export default ForwardedTextBox;
