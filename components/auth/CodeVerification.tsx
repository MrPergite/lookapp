import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Keyboard, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '@/styles/theme';
import { ThemedText } from '../ThemedText';

interface CodeVerificationProps {
  type: 'email' | 'phone';
  destination: string;
  onSubmit: (code: string) => void;
  onResend: () => void;
  isLoading?: boolean;
  errorMessage?: string | null;
  onCancel?: () => void;
}

const CodeVerification: React.FC<CodeVerificationProps> = ({
  type,
  destination,
  onSubmit,
  onResend,
  isLoading = false,
  errorMessage,
  onCancel,
}) => {
  const [code, setCode] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleChange = (val: string) => {
    if (/^\d{0,6}$/.test(val)) {
      setCode(val);
      if (val.length === 6) {
        Keyboard.dismiss();
        onSubmit(val);
      }
    }
  };

  // Split code into array for boxes
  const codeDigits = code.split('').concat(Array(6 - code.length).fill(''));

  const handleBoxPress = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <LinearGradient
      colors={[theme.colors.primary.lavender, theme.colors.primary.white]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        <ThemedText type="title" style={styles.title}>
          Verify your {type}
        </ThemedText>
        <Text style={styles.subtitle}>
          Enter the verification code sent to your {type}
        </Text>
        <Text style={styles.destination}>{destination}</Text>
        <View style={styles.codeInputRow}>
          {codeDigits.map((digit, idx) => (
            <TouchableOpacity key={idx} style={styles.codeBox} onPress={handleBoxPress} activeOpacity={0.7}>
              <Text style={styles.codeDigit}>{digit}</Text>
            </TouchableOpacity>
          ))}
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={handleChange}
            keyboardType="numeric"
            maxLength={6}
            style={styles.hiddenInput}
            autoFocus
            autoComplete="sms-otp"
            autoCorrect={false}
            autoCapitalize="none"
            keyboardAppearance="light"
            textContentType="oneTimeCode"
            inputMode="numeric"
            returnKeyType="done"
          />
        </View>
        {errorMessage ? (
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        ) : null}
        <TouchableOpacity onPress={() => {
          Keyboard.dismiss();
          setCode('');
          onResend();
        }} disabled={isLoading}>
          <Text style={styles.resendText}>Didn't receive a code? <Text style={{ textDecorationLine: 'underline' }}>Resend</Text></Text>
        </TouchableOpacity>
        {onCancel && (
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  innerContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.secondary.darkGray,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'default-regular',
  },
  destination: {
    fontFamily: 'default-semibold',
    color: theme.colors.secondary.black,
    marginBottom: 24,
    fontSize: 18,
  },
  codeInputRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  codeBox: {
    width: 44,
    height: 56,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.primary.purple,
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  codeDigit: {
    fontSize: 28,
    color: theme.colors.secondary.black,
    fontFamily: 'default-bold',
    textAlign: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    width: 264,
    height: 56,
    opacity: 0,
    left: 0,
    top: 0,
  },
  errorMessage: {
    color: 'red',
    marginBottom: 16,
    fontFamily: 'default-medium',
    textAlign: 'center',
  },
  resendText: {
    color: theme.colors.secondary.darkGray,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  cancelButton: {
    padding: 16,
  },
  cancelButtonText: {
    color: theme.colors.secondary.darkGray,
    fontSize: 16,
    fontFamily: 'default-medium',
  },
});

export default CodeVerification; 