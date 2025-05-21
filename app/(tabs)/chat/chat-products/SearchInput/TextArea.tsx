// TextArea.tsx

import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { ArrowUp } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface TextAreaProps {
  darkMode: boolean;
  inputValue: string;
  textareaRef: React.RefObject<TextInput>;
  handleInputChange: (text: string) => void;
  handleKeyDown?: (e: any) => void;
  handleFocus: () => void;
  handleBlur: () => void;
  handleSearch: () => void;
  inputMode: string;
  getPlaceholderText: () => string;
  uploadedImage: string | null;
  isSecondHand: boolean;
}

export default function TextArea({
  darkMode,
  inputValue,
  textareaRef,
  handleInputChange,
  handleKeyDown,
  handleFocus,
  handleBlur,
  handleSearch,
  uploadedImage,
  inputMode,
  isSecondHand,
  getPlaceholderText,
}: TextAreaProps) {
  // roughly replicate your CSS minHeight logic
  const minHeight = SCREEN_WIDTH < 640 ? 25 : 40;

  const disabled =
    (!inputValue && !uploadedImage && inputMode !== 'social') ||
    (isSecondHand && inputValue === '') ||
    (inputMode === 'outfit-matcher' && inputValue === '');

  return (
    <View style={styles.container}>
      <TextInput
        ref={textareaRef}
        value={inputValue}
        onChangeText={handleInputChange}
        onSubmitEditing={handleSearch}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={getPlaceholderText()}
        placeholderTextColor={darkMode ? '#888' : '#888'}
        style={[
          styles.input,
          {
            color: 'rgb(55,65,81,1)',
            minHeight,
            maxHeight: 200,
          },
        ]}
      />
      <TouchableOpacity
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={handleSearch}
        disabled={disabled}
      >
        <ArrowUp
          size={16}
          color={
            inputValue || uploadedImage
              ? '#FFF'
              : darkMode
              ? '#888'
              : '#888'
          }
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  input: {
    flex: 1,
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 6 : 0,
    backgroundColor: 'transparent',
    fontSize: 16,
  },
  button: {
    marginLeft: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6', // blue-500
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: 'transparent',
  },
});
