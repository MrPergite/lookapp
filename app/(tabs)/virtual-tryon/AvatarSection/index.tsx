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
import theme from '@/styles/theme';

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
  credits: number;
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
  credits,
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
            activeOpacity={0.8}
          >
            <Maximize2 color={theme.colors.primary.purple as string} size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleModelChange}
            style={styles.avatarButton}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.colors.primary.purple as string, '#ec4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientAvatarButton}
            >
              <UserRound size={16} color="#fff" style={{marginRight: 6}} />
              <RefreshCw size={14} color="#fff" />
            </LinearGradient>
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
                  contentFit="contain"
                  {...(isSignedIn ? {
                    contentPosition: 'bottom center'
                  } : {
                    contentPosition: "top"
                  })}
                />
                
                {/* Add subtle vignette overlay for depth */}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.1)']}
                  style={styles.vignetteOverlay}
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
                  {...(isSignedIn ? {
                    contentPosition: 'bottom center'
                  } : {
                    contentPosition: "top center",
                  })}
                />
                
                {/* Add subtle vignette overlay for depth */}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.1)']}
                  style={styles.vignetteOverlay}
                />
              </View>
            )}
          </>
        )}

        {!isSignedIn && !tryonImages && (
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
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
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[theme.colors.primary.purple as string, '#ec4899', '#6366f1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.signUpGradient}
                >
                  <Text style={styles.signUpButtonText}>Sign Up Free</Text>
                </LinearGradient>
              </TouchableOpacity>

              <Text
                onPress={() => redirectToSignIn(addScreenToHistory)}
                style={styles.signInText}>Already have an account? Sign in</Text>
            </View>
          </LinearGradient>
        )}

        {isAvatarLoading && (
          <View style={styles.loadingOverlay}>
            <LinearGradient
              colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.8)']}
              style={styles.loadingGradient}
            >
              <View style={styles.loadingContent}>
                <View style={styles.loadingSpinnerActive} />
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
            </LinearGradient>
          </View>
        )}

        {tryonImages && isSignedIn && !isAvatarLoading && (
          <View style={styles.buttonContainer}>
            {!isFromSavedOutfit && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onSaveOutfit}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[theme.colors.primary.purple as string, '#ec4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionButtonGradient}
                >
                  <BookmarkPlus size={16} color="#fff" style={{marginRight: 6}} />
                  <Text style={styles.buttonText}>Save this outfit</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetAvatar}
              activeOpacity={0.8}
            >
              <RotateCw size={16} color={theme.colors.primary.purple as string} style={{marginRight: 6}} />
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
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
    backgroundColor: '#fff',
  },
  imageCard: {
    width: '80%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 20,
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
  },
  fullscreenButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarButton: {
    overflow: 'hidden',
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gradientAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
    borderRadius: responsiveFontSize(24),
    position: 'relative',
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
  vignetteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: responsiveFontSize(24),
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  unlockTitle: {
    fontSize: responsiveFontSize(20),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  unlockSubtitle: {
    fontSize: responsiveFontSize(14),
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 24,
  },
  signUpButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  signUpGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
  },
  signInText: {
    fontSize: responsiveFontSize(14),
    color: '#fff',
    textDecorationLine: 'underline',
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
    borderColor: theme.colors.primary.purple,
    borderTopColor: 'transparent',
  },
  loadingSpinnerActive: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#fff',
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
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    overflow: 'hidden',
  },
  loadingGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTitle: {
    color: 'white',
    fontSize: responsiveFontSize(18),
    fontWeight: '600',
    marginTop: 16,
  },
  loadingSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: responsiveFontSize(14),
    textAlign: 'center',
    marginTop: 6,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: 'column',
    gap: 10,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  buttonText: {
    color: '#fff',
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
  },
  resetButtonText: {
    color: theme.colors.primary.purple as string,
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
  },
  statusPillPositionContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
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