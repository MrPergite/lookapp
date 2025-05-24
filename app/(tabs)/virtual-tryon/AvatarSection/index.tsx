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
import AvatarStatusPill from "../AvatarStatusPill";

// Get screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Define AvatarStatus type (can be moved to a shared types file if used elsewhere)
type AvatarStatus = 'ready' | 'processing' | 'pending' | 'failed' | string | null | undefined;

interface AvatarSectionProps {
  selectedAvatar: any;
  onAvatarSelect: () => void;
  onSaveOutfit: () => void;
  setIsFullscreen: (value: boolean) => void;
  isExpanded: boolean;
  tryonImages: any;
  onResetAvatar: () => void;
  originalAvatar: any;
  isAvatarLoading: boolean;
  isLoadingPrefAvatar: boolean;
  isFromSavedOutfit: boolean;
  avatarStatus: AvatarStatus;
  avatarCreationProgress?: number;
  onShowMyAvatars?: () => void;
  onRecreateAvatar?: () => void;
}

const AvatarSection = ({
  selectedAvatar,
  onAvatarSelect,
  onSaveOutfit,
  setIsFullscreen,
  isExpanded,
  tryonImages,
  onResetAvatar,
  originalAvatar,
  isAvatarLoading,
  isLoadingPrefAvatar,
  isFromSavedOutfit,
  avatarStatus,
  avatarCreationProgress,
  onShowMyAvatars,
  onRecreateAvatar,
}: AvatarSectionProps) => {
  const { isSignedIn } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const { addScreenToHistory } = useScreenHistoryContext();

  // LOGS FOR DEBUGGING PILL VISIBILITY - MOVED HERE
  console.log('[AvatarSection] Props for Pill Condition:');
  console.log('  tryonImages:', tryonImages);
  console.log('  isSignedIn:', isSignedIn);
  console.log('  isAvatarLoading (prop for general avatar load):', isAvatarLoading);
  console.log('  avatarStatus (prop received for pill):', avatarStatus);
  console.log('  avatarCreationProgress (prop received for pill):', avatarCreationProgress);

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

    // LOGS FOR DEBUGGING PILL VISIBILITY
    console.log('[AvatarSection] Props for Pill Condition:');
    console.log('  tryonImages:', tryonImages);
    console.log('  isSignedIn:', isSignedIn);
    console.log('  isAvatarLoading:', isAvatarLoading);
    console.log('  avatarStatus (prop received):', avatarStatus);
    console.log('  avatarCreationProgress (prop received):', avatarCreationProgress);
  };

  return (
    <MotiView
      animate={{
        opacity: isExpanded ? 0.3 : 1,
      }}
      transition={{ duration: 0.3 }}
      style={styles.mainContainer}
    >
      <View style={styles.imageCard}>
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.fullscreenButton}
            onPress={() => setIsFullscreen(true)}
          >
            <Maximize2 color="#000" size={20} />
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
              <View style={styles.imageContainer}>
                <Image
                  style={styles.avatarImage}
                  source={{ uri: tryonImages.output_images[0] }}
                  contentFit="contain"
                  contentPosition="top center"
                />
              </View>
            ) : (
              <View style={styles.imageContainer}>
                <Image
                  style={styles.avatarImage}
                  source={{ uri: selectedAvatar.src }}
                  contentFit="contain"
                  contentPosition="top center"
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
              <Text style={styles.unlockSubtitle}>
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
                style={styles.signInText}
              >
                Already have an account? Sign in
              </Text>
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
              >
                {loadingMessages[loadingMessageIndex].title}
              </MotiText>
              <MotiText
                key={`sub-${loadingMessageIndex}`}
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                style={styles.loadingSubtitle}
              >
                {loadingMessages[loadingMessageIndex].subtitle}
              </MotiText>
            </View>
          </View>
        )}

        {!tryonImages && isSignedIn && !isAvatarLoading && (
          <View style={styles.statusPillPositionContainer}>
            <AvatarStatusPill 
              avatarStatus={avatarStatus}
              avatarCreationProgress={avatarCreationProgress}
              onShowMyAvatars={onShowMyAvatars}
              onRecreateAvatar={onRecreateAvatar}
            />
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
  },
  imageCard: {
    width: '90%',
    height: '85%',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 16,
    zIndex: 20,
    position: 'absolute',
    top: 0,
    right: 0,
  },
  fullscreenButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
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
    bottom: 40,
    zIndex: 2,
  },
  lockIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  unlockTitle: {
    fontSize: responsiveFontSize(20),
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  unlockSubtitle: {
    fontSize: responsiveFontSize(14),
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  signUpButton: {
    backgroundColor: '#A855F7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 12,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: responsiveFontSize(16),
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  signInText: {
    fontSize: responsiveFontSize(14),
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(250, 250, 250, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
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
    borderColor: '#A855F7',
    borderTopColor: 'transparent',
  },
  loadingText: {
    fontSize: responsiveFontSize(14),
    color: '#6b7280',
    marginTop: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  loadingTitle: {
    color: 'white',
    fontSize: responsiveFontSize(18),
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: responsiveFontSize(14),
    marginTop: 8,
    textAlign: 'center',
  },
  floatingSaveButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#A855F7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    fontSize: responsiveFontSize(14),
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  statusPillPositionContainer: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
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
});

export default AvatarSection;