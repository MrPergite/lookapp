import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { Camera, ArrowUp, Instagram } from 'lucide-react-native';
import theme from '@/styles/theme';
import Disclaimer from './Disclaimer';
import { LinearGradient } from 'expo-linear-gradient';

interface MessageInputProps {
  onSend: (message: string) => void;
  onImageSelect?: () => void;
  onSocialSelect?: () => void;
  placeholder?: string;
  disabled?: boolean;
  renderImagePreview?: () => React.ReactNode;
  showImagePreview?: boolean;
  setSearchText: (text: string) => void;
  searchText: string;
  source?: string;
}


export const MessageSendButton = ({ searchText = '', disabled, onSend, onImageSelect, onSocialSelect, source = "home" }: Partial<MessageInputProps>) => {

  const handleSend = () => {
    try {
      if (searchText && searchText.trim() && onSend && typeof onSend === 'function') {
        onSend(searchText.trim());
      }
    } catch (error) {
      console.error("Error in handleSend:", error);
    }
  };

  const SendBtn = ({ source }: { source: string }) => {
    if (source === "home") {
      return (
        <TouchableOpacity
          style={[styles.iconButton]}
          onPress={handleSend}
          disabled={disabled || !searchText.trim()}
        >
           <LinearGradient
             colors={['#8B5CF6', '#EC4899', '#3B82F6']}
             start={{ x: 0, y: 0 }}
             end={{ x: 1, y: 1 }}
             style={{ borderRadius: 100, padding: 4 }}
           >
             <ArrowUp size={20} color={searchText.trim() ? "#fff" : theme.colors.secondary.mediumLightGray} />
           </LinearGradient>
        </TouchableOpacity>
      )
    }
    return (
      <TouchableOpacity
        style={[styles.iconButton, { backgroundColor: "transparent", borderRadius: 100 }]}
        onPress={handleSend}
        disabled={disabled || !searchText.trim()}
      >
        <LinearGradient
          colors={['#8B5CF6', '#EC4899', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 100, padding: 4 }}
        >
          <ArrowUp size={20} color={searchText.trim() ? "#fff" : theme.colors.secondary.mediumLightGray} />
        </LinearGradient>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.actions}>
      {/* <TouchableOpacity
        style={styles.iconButton}
        onPress={onImageSelect}
      >
        <Camera size={20} color="#9ca3af" />
      </TouchableOpacity> */}

      {onSocialSelect && <TouchableOpacity
        style={styles.iconButton}
        onPress={onSocialSelect}
      >
        <Instagram size={20} color="#9ca3af" />
      </TouchableOpacity>}

      <SendBtn source={source} />
    </View>
  )
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  onImageSelect,
  onSocialSelect,
  placeholder = "Type a message...",
  disabled = false,
  renderImagePreview = () => null,
  showImagePreview = false,
  setSearchText,
  searchText,
  source = "home"
}) => {

  const handleSend = () => {
    try {
      if (searchText && searchText.trim() && !disabled) {
        onSend(searchText.trim());
        setSearchText('');
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const screenWidth = Dimensions.get('window').width;

  return (
    <View style={styles.container}>
      {showImagePreview && <View style={styles.imagePreviewContainer}>
        {renderImagePreview()}
      </View>}
      <View style={[
        styles.inputContainer, 
        showImagePreview && { borderTopLeftRadius: 0, borderTopRightRadius: 0 }
      ]}>
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

        <MessageSendButton 
          searchText={searchText} 
          disabled={disabled} 
          onSend={handleSend} 
          onImageSelect={onImageSelect} 
          source={source} 
        />
      </View>
      <Disclaimer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: "100%",
    backdropFilter: 'blur(12px)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.opacity.low,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: 'rgba(243, 244, 246, 0.6)',
    borderRadius: 24,
    padding: 12,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  }
});

export default MessageInput; 