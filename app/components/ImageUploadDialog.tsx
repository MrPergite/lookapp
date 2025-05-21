import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, Platform, TouchableWithoutFeedback } from 'react-native';
import { Link } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '@/styles/theme';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';
import MaskedView from '@react-native-masked-view/masked-view';

interface ImageUploadDialogProps {
  isVisible: boolean;
  onClose: () => void;
  defaultTab?: 'social' | 'upload';
  onSocialUrlSubmit: (url: string) => void;
}

const ImageUploadDialog = ({ isVisible, onClose, defaultTab = 'social', onSocialUrlSubmit }: ImageUploadDialogProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [socialUrl, setSocialUrl] = useState('');
  const [error, setError] = useState(false);

  const handleSocialUrlSubmit = () => {
    try {
      const isValidUrl = socialUrl.startsWith('https://www.instagram.com/') || socialUrl.startsWith('https://www.tiktok.com/');
      if (!isValidUrl) {
        setError(true);
        return;
      }
      onSocialUrlSubmit(socialUrl);
      setError(false);
      setSocialUrl('');
      onClose();
    } catch (error) {
      console.error("Error submitting social URL:", error);
      setError(true);
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
         
            <View style={styles.dialogContainer}>
              <MaskedView
          maskElement={
            <Text style={styles.dialogTitle}> Search</Text>
          }
        >
          <LinearGradient
            colors={['#8B5CF6', '#EC4899', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 24 }}
          />
        </MaskedView>
              {/* Social Tab Content */}
              {activeTab === 'social' && (
                <View style={styles.socialTabContainer}>
                  <Text style={styles.socialTabDescription}>
                    Paste an Instagram post URL, and we'll help you find the exact fashion items featured in it (Tiktok coming soon)
                  </Text>

                  <View style={styles.inputContainer}>
                    <View style={styles.inputIconContainer}>
                      <Link size={20} color={theme.colors.secondary.darkGray} />
                    </View>
                    <TextInput
                      style={[styles.textInput, error && styles.textInputError]}
                      placeholder="Paste Instagram URL"
                      value={socialUrl}
                      onChangeText={(text) => {
                        setSocialUrl(text);
                        setError(false);
                      }}
                      autoCapitalize="none"
                      keyboardType="url"
                    />
                    {error && <Text style={styles.errorText}>
                      Invalid URL
                    </Text>}
                  </View>

                  <TouchableOpacity
                    onPress={handleSocialUrlSubmit}
                    disabled={!socialUrl}
                    style={[styles.submitButton, !socialUrl && styles.submitButtonDisabled]}
                  >
                    <LinearGradient
                      colors={['#8B5CF6', '#EC4899', '#3B82F6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.submitButtonGradient}
                    >
                      <Text style={styles.submitButtonText}>Search with URL</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <Text style={styles.infoText}>
                    If we're unable to locate the exact product in your image, we'll do our best to find the closest match for you.
                  </Text>
                </View>
              )}

              {/* Upload Tab Content */}
              {activeTab === 'upload' && (
                <View style={styles.uploadTabContainer}>
                  <Text style={styles.uploadTabText}>
                    Upload functionality coming soon
                  </Text>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    backgroundColor: 'white',
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 600,
    textAlign: 'center',
  },
  socialTabContainer: {
  },
  socialTabDescription: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 20,
     fontWeight: 500,
     marginTop: 24,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  inputIconContainer: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 1,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingLeft: 40,
    paddingVertical: 12,
    fontSize: 16,
  },
  textInputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'left',
    color: '#EF4444',
    fontWeight: '700',
    marginTop: 8,
  },
  submitButton: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonGradient: {
    paddingVertical: 10,
  },
  submitButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
   
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6B7280',
    fontStyle: 'italic',
    lineHeight: 20,
    fontWeight: 600,
  },
  uploadTabContainer: {
  },
  uploadTabText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6B7280',
  },
});

export default ImageUploadDialog; 