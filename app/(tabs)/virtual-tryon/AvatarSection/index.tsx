import React, { useState, useEffect } from "react";
import { MotiSafeAreaView, MotiText, MotiView } from "moti";
import {
  UserRound,
  RefreshCw,
  Maximize2,
  BookmarkPlus,
  Lock,
  RotateCw,
  X,
} from 'lucide-react-native';
import { useAuth, useClerk } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { Button, Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, Dimensions } from "react-native";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { responsiveFontSize } from "@/utils";
import { Easing, runOnJS } from "react-native-reanimated";
import { Image } from 'expo-image';
import { redirectToSignIn, redirectToSignUp, withAuthScreenHistory } from "../utils";
import { useScreenHistoryContext } from "@/common/providers/screen-history";

// Get screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AvatarSectionProps {
  selectedAvatar: any;
  onAvatarSelect: () => void;
  onSaveOutfit: () => void;
  setIsFullscreen: (value: boolean) => void;
  isExpanded: boolean;
  credits: number;
  tryonImages: any;
  onResetAvatar: () => void;
  originalAvatar: any;
  isAvatarLoading: boolean;
  isLoadingPrefAvatar: boolean;
  isFromSavedOutfit: boolean;
}

const AvatarSection = ({
  selectedAvatar,
  onAvatarSelect,
  onSaveOutfit,
  setIsFullscreen,
  isExpanded,
  credits,
  tryonImages,
  onResetAvatar,
  originalAvatar,
  isAvatarLoading,
  isLoadingPrefAvatar,
  isFromSavedOutfit,
}: AvatarSectionProps) => {
  const { isSignedIn } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const { addScreenToHistory } = useScreenHistoryContext();

  // Loading messages that rotate
  const loadingMessages = [
    { title: "Creating your look...", subtitle: "Just a moment while we try this on" },
    { title: "Generating outfit...", subtitle: "LookAI is working its magic" },
    { title: "Almost there...", subtitle: "Making it look perfect for you" },
    { title: "Applying finishing touches...", subtitle: "This is going to look great!" },
    { title: "Customizing for your avatar...", subtitle: "Tailoring this outfit just for you" },
  ];

  // Rotate through loading messages every 3 seconds
  useEffect(() => {
    if (!isAvatarLoading || loadingMessages.length === 0) return;

    let index = 0;
    setLoadingMessageIndex(0);

    const runLoop = () => {
      if (index >= loadingMessages.length - 1) return;

      index += 1;
      setTimeout(() => {
        runOnJS(setLoadingMessageIndex)(index);
        runLoop(); // recursively continue
      }, 3000);
    };

    runLoop();
  }, [isAvatarLoading, loadingMessages.length]);

  const handleModelChange = () => {
    if (!isSignedIn) {
      setShowAuthDialog(true);
      return;
    }
    onAvatarSelect();
  };

  const handleResetAvatar = () => {
    if (originalAvatar) {
      onResetAvatar();
      Toast.show({
        type: "success",
        text1: "Avatar has been reset to original",
      });
    }
  };

  return (
    <MotiView
      animate={{
        height: isExpanded ? 0 : screenHeight,
        opacity: isExpanded ? 0.3 : 1,
      }}
      transition={{ duration: 0.3 }}
      id={
        isSignedIn
          ? "virtual-tryon-image-mobile"
          : "virtual-tryon-image-mobile-loggedout"
      }
      style={styles.mainContainer}>
      <View style={[styles.imageCard, isSignedIn && { width: "auto" }]}>
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.fullscreenButton}
            onPress={() => setIsFullscreen(true)}
          >
            <Maximize2 color="#000" size={18} />
          </TouchableOpacity>

            <TouchableOpacity
              onPress={handleModelChange}
              style={styles.avatarButton}
            >
              <View style={styles.userIconContainer}>
                <UserRound size={14} color="#333" />
              </View>
              <RefreshCw size={14} color="#555" />
            </TouchableOpacity>
        </View>

        {isLoadingPrefAvatar && isSignedIn ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingContent}>
              <View style={styles.loadingSpinner} />
              <Text style={styles.loadingText}>Loading your avatar...</Text>
            </View>
          </View>
        ) : (
          <>
            {tryonImages ? (
              <View style={[styles.imageContainer]}>
                <Image
                  style={[styles.avatarImage, isSignedIn && styles.signedInAvatar]}
                  source={{ uri: tryonImages.output_images[0] }}
                  id="virtual-tryon-content-mobile"
                  contentFit="cover"
                  {
                  ...(isSignedIn ? {
                    contentPosition: 'bottom center'
                  } : {
                    contentPosition: "top"
                  })
                  }
                />
              </View>
            ) : (
              <View style={[styles.imageContainer]}>
                <Image
                  style={[styles.avatarImage,
                  isSignedIn ? styles.signedInAvatar : {
                    width: '100%',
                    height: '100%',
                  }]}
                  source={{ uri: selectedAvatar.src }}
                  id="virtual-avatar-content-mobile"
                  contentFit="cover"
                  {
                  ...(isSignedIn ? {
                    contentPosition: 'bottom center'
                  } : {
                    contentPosition: "top center",
                  })
                  }
                />
              </View>
            )}
          </>
        )}

        {!isSignedIn && !tryonImages && (
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
            style={styles.gradientOverlay}
          >
            <View style={styles.authContentContainer}>
              <View style={styles.lockIconContainer}>
                <Lock size={24} color="#fff" />
              </View>
              <Text style={styles.unlockTitle}>Unlock All Features</Text>
              <Text
                className="text-xs text-gray-200"
                style={styles.unlockSubtitle}>
                Create an account to customize your avatar and try on your own outfits
              </Text>
              <TouchableOpacity
                style={styles.signUpButton}
                onPress={() => redirectToSignUp(addScreenToHistory)}
              >
                <Text style={styles.signUpButtonText}>Sign Up Free</Text>
              </TouchableOpacity>

              <Text
                onPress={() => redirectToSignIn(addScreenToHistory)}
                className="text-xs text-white hover:text-gray-200 underline underline-offset-4"
                style={styles.signInText}>Already have an account? Sign in</Text>
            </View>
          </LinearGradient>
        )}

        {isAvatarLoading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContent}>
              <View className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white" />
              <MotiText
                key={loadingMessageIndex}
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={styles.loadingTitle}
                className="text-white mt-3 text-center font-medium"
              >
                {loadingMessages[loadingMessageIndex].title}
              </MotiText>
              <MotiText
                key={`sub-${loadingMessageIndex}`}
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                style={styles.loadingSubtitle}
                className="text-center"
              >
                {loadingMessages[loadingMessageIndex].subtitle}
              </MotiText>
            </View>
          </View>
        )}

        {tryonImages && isSignedIn && !isAvatarLoading && (
          <View style={styles.buttonContainer}>
            {!isFromSavedOutfit && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onSaveOutfit}
              >
                <BookmarkPlus size={16} color="#333" />
                <Text style={styles.buttonText}>Save this outfit</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleResetAvatar}
            >
              <RotateCw size={16} color="#333" />
              <Text style={styles.buttonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal visible={showAuthDialog} onDismiss={() => setShowAuthDialog(false)}>
        <SafeAreaView style={styles.modalOverlay}>
          <View
            style={styles.modalContainer}>
            <View className="absolute top-4 right-4">
              <X onPress={() => setShowAuthDialog(false)} size={16} color="black" style={styles.closeButton} />
            </View>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalLockContainer}>
                  <Lock color='#6d28d9' size={24} />
                </View>
                <Text
                  className="tracking-tight text-xl font-semibold"
                  style={styles.modalTitle}>
                  Create an Account to Customize
                </Text>
                <Text
                  className="text-sm text-gray-500"
                  style={styles.modalSubtitle}>
                  Sign up to unlock avatar customization and try on your favorite
                  outfits
                </Text>
              </View>
            </View>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                onPress={() => redirectToSignUp(addScreenToHistory)}
                style={styles.modalButtonRounded}
              >
                <LinearGradient
                  colors={['#9333EA', '#E11D48']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <Text style={styles.gradientButtonText}>
                    Create Free Account
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.borderButton}
                onPress={() => redirectToSignIn(addScreenToHistory)}
              >
                <Text style={styles.borderButtonText}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
  },
  imageCard: {
    width: '80%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    alignSelf: 'center',
  },
  topControls: {
    // position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 20,
  },
  fullscreenButton: {
    width: 45,
    height: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 10,
    left: 10,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
   
   
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 243, 243, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 8,
    position: 'absolute',
    top: 10,
    right: 10,
  },
  userIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
    borderRadius: responsiveFontSize(24),
  },
  avatarImage: {
    width: '100%',
    resizeMode: 'cover',
  },
  signedInAvatar: {
    width: 250,
    height: "100%",
    resizeMode: 'cover',
    alignSelf: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    zIndex: 1,
  },
  authContentContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    bottom: 0,
    zIndex: 2,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(243, 244, 246, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
    borderTopColor: 'transparent',
  },
  loadingText: {
    fontSize: responsiveFontSize(14),
    color: '#6b7280',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24
  },
  loadingTitle: {
    color: 'white',
    fontSize: responsiveFontSize(16),
    fontWeight: '500',
    marginTop: 12,
  },
  loadingSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: responsiveFontSize(12),
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
    justifyContent: 'center',
    width: '100%',
    alignSelf: 'center',

  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 50,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    fontSize: responsiveFontSize(14),
    color: '#333',
    fontWeight: '500',
  },
  lockIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  unlockTitle: {
    color: 'white',
    fontSize: responsiveFontSize(18.72),
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  unlockSubtitle: {
    color: 'white',
    fontSize: responsiveFontSize(12),
    textAlign: 'center',
    lineHeight: responsiveFontSize(16),
  },
  signUpButton: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 50,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    height: 40,
    marginTop: responsiveFontSize(16),
  },
  signUpButtonText: {
    color: '#000',
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
  },
  signInText: {
    color: 'white',
    fontSize: responsiveFontSize(12),
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    maxWidth: 425,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
  },
  modalContent: {
    padding: 16,
  },
  modalHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  modalLockContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: responsiveFontSize(20),
    fontWeight: '600',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: responsiveFontSize(14),
    color: 'rgba(107 114 128 / 1)',
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
  modalButtonContainer: {
    gap: 12,
    marginTop: 16,
  },
  modalButtonRounded: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  gradientButtonText: {
    color: 'white',
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
  },
  borderButton: {
    borderWidth: 1,
    borderColor: 'hsl(214.3, 31.8%, 91.4%)',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  borderButtonText: {
    fontSize: responsiveFontSize(16),
    color: '#333',
    fontFamily: 'Inter-Medium',
  },
  closeButton: {

  },
  spinnerContainer: {
    width: 40,
    height: 40,
    marginBottom: 16,
  },
});

export default AvatarSection;