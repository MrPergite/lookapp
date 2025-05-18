import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { Link } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '@/styles/theme';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';

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
      <View className="flex-1 bg-black/50 justify-center items-center">
        <View className="bg-white w-[90%] max-w-[400px] rounded-2xl p-6">
          <Text className="text-xl font-semibold mb-4 text-center">Upload or Search</Text>

          {/* Tabs */}
          {/* <View className="flex-row mb-6 border-b border-gray-200">
            <TouchableOpacity
              className={`flex-1 py-2 ${activeTab === 'social' ? 'border-b-2 border-purple-500' : ''}`}
              onPress={() => setActiveTab('social')}
            >
              <Text className={`text-center ${activeTab === 'social' ? 'text-purple-500 font-medium' : 'text-gray-500'}`}>
                Social Media
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 ${activeTab === 'upload' ? 'border-b-2 border-purple-500' : ''}`}
              onPress={() => setActiveTab('upload')}
            >
              <Text className={`text-center ${activeTab === 'upload' ? 'text-purple-500 font-medium' : 'text-gray-500'}`}>
                Upload
              </Text>
            </TouchableOpacity>
          </View> */}

          {/* Social Tab Content */}
          {activeTab === 'social' && (
            <View className="space-y-4 gap-4">
              <Text className="text-sm text-center text-gray-500 mb-6">
                Paste an Instagram post URL, and we'll help you find the exact fashion items featured in it (Tiktok coming soon)
              </Text>

              <View className="relative">
                <View className="absolute left-3 top-3">
                  <Link size={20} color={theme.colors.secondary.darkGray} />
                </View>
                <TextInput
                  className={`border border-purple-200 rounded-lg pl-10 py-3 text-base ${error && 'border-red-500'}`}
                  placeholder="Paste Instagram URL"
                  value={socialUrl}
                  onChangeText={(text) => {
                    setSocialUrl(text);
                    setError(false);
                  }}
                  autoCapitalize="none"
                  keyboardType="url"
                />
                {error && <Text className="text-sm text-left text-red-500 bold mt-2">
                  Invalid URL
                </Text>}
              </View>

              <TouchableOpacity
                onPress={handleSocialUrlSubmit}
                disabled={!socialUrl}
                className={`w-full rounded-lg overflow-hidden ${!socialUrl ? 'opacity-50' : ''}`}
              >
                <LinearGradient
                  colors={[theme.colors.primary.purple, '#8C52FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="py-3"
                >
                  <Text className="text-white text-center font-semibold p-4">Search with URL</Text>
                </LinearGradient>
              </TouchableOpacity>

              <Text className="text-sm text-center text-gray-500 italic">
                If we're unable to locate the exact product in your image, we'll do our best to find the closest match for you.
              </Text>

            </View>
          )}

          {/* Upload Tab Content */}
          {activeTab === 'upload' && (
            <View className="space-y-4">
              <Text className="text-sm text-center text-gray-500">
                Upload functionality coming soon
              </Text>
            </View>
          )}


        </View>
      </View>
    </Modal>
  );
};

export default ImageUploadDialog; 