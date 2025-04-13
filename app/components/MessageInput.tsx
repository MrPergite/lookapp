import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Camera, ArrowUp } from 'lucide-react-native';
import theme from '@/styles/theme';
import Disclaimer from './Disclaimer';

interface MessageInputProps {
  onSend: (message: string) => void;
  onImageSelect?: () => void;
  placeholder?: string;
  disabled?: boolean;
  renderImagePreview?: () => React.ReactNode;
  showImagePreview?: boolean;
  setSearchText: (text: string) => void;
  searchText: string;
}

export const MessageSendButton = ({ searchText = '', disabled, onSend, onImageSelect }: Partial<MessageInputProps>) => {
  return (
    <View style={styles.actions}>
      <TouchableOpacity
        style={styles.iconButton}
        onPress={onImageSelect}
      >
        <Camera size={20} color="#9ca3af" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.iconButton, { backgroundColor: searchText.trim() ? "#3b82f6" : "transparent", borderRadius: 100 }]}
        onPress={onSend}
        disabled={disabled || !searchText.trim()}
      >
        <ArrowUp size={20} color={searchText.trim() ? "#fff" : theme.colors.secondary.mediumLightGray} />
      </TouchableOpacity>
    </View>
  )
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  onImageSelect,
  placeholder = "Type a message...",
  disabled = false,
  renderImagePreview = () => null,
  showImagePreview = false,
  setSearchText,
  searchText,
}) => {

  const handleSend = () => {
    if (searchText.trim()) {
      onSend(searchText.trim());
      setSearchText('');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
      style={styles.keyboardAvoidingView}
    >
      <View style={styles.container}>
        {showImagePreview && <View style={styles.imagePreviewContainer}>
          {renderImagePreview()}
        </View>}
        <View style={[styles.inputContainer, showImagePreview && { borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            value={searchText}
            onChangeText={setSearchText}
            multiline={false}
            editable={!disabled}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <MessageSendButton searchText={searchText} disabled={disabled} onSend={handleSend} onImageSelect={onImageSelect} />
        </View>
        <Disclaimer />
      </View>

    </KeyboardAvoidingView >
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    width: '100%',
  },
  container: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'transparent',

  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: 'rgba(249, 250, 251, 0.93)',
    width: "100%",
    backdropFilter: 'blur(10px)',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 0,
    marginRight: 8,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  imagePreviewContainer: {
    width: "100%",
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    padding: 12,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  }
});

export default MessageInput; 