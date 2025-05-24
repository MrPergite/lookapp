import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable, ActivityIndicator, Dimensions, Modal, Image, Animated } from 'react-native';
import { MotiView, MotiText, AnimatePresence } from 'moti';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { Camera as CameraIcon, Check, Loader2 as Loader, X as XIcon, Image as ImageIcon, HelpCircle, Sparkles } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import axios from 'axios';
import CameraCapture from './CameraCapture';
import ImageGrid from './ImageGrid';
import PhotoRecommendations from './PhotoRecommendations';
import * as Haptics from 'expo-haptics';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';

import { useOnBoarding } from '../context';
import theme from '@/styles/theme';
import { ThemedText } from '@/components/ThemedText';
import { useApi } from '@/client-api';
import { StyleProfileDataType } from '../context';
import { routes } from '@/client-api/routes';
import { getSavedDetails } from '@/utils';

// Define the props for StyleProfile, including the ref if you were to type it strictly for forwardRef
interface StyleProfileProps {
  onBack: () => void;
  onNext: (data: any) => void;
}

// Define the type for the exposed imperative methods
export interface StyleProfileRefHandles {
  submitStep: () => Promise<void>;
}

const StyleProfile = forwardRef<StyleProfileRefHandles, StyleProfileProps>(({ onBack, onNext: onNextProp }, ref) => {
  const { payload: contextPayload, dispatch } = useOnBoarding();
  const { user } = useUser();
  const { callProtectedEndpoint, callPublicEndpoint } = useApi();

  const [images, setImages] = useState<string[]>(contextPayload.styleProfileState?.images || []);
  const [processingStatus, setProcessingStatus] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    (contextPayload.styleProfileState?.images || []).forEach((_:any, i:number) => initial[i] = contextPayload.styleProfileState?.processingStatus?.[i] || 'approved');
    return initial;
  });
  const [rejectionReasons, setRejectionReasons] = useState<Record<number, string>>(contextPayload.styleProfileState?.rejectionReasons || {});
  
  // Add a counter to force grid updates when validation changes
  const [validationUpdateCount, setValidationUpdateCount] = useState(0);
  
  // Add state to track API processing for the Next button text
  const [isApiProcessing, setIsApiProcessing] = useState(false);

  const [avatarStatus, setAvatarStatus] = useState(user?.publicMetadata?.avatar_creation_status || 'pending');
  const [isCameraModalVisible, setIsCameraModalVisible] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processingImageIndices, setProcessingImageIndices] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [avatarGenerationStartTime, setAvatarGenerationStartTime] = useState<number | null>(contextPayload.styleProfileState?.avatarGenerationStartTime || null);
  const [progressValue, setProgressValue] = useState(contextPayload.styleProfileState?.progressValue || 0);
  
  // Add states for tooltips and celebrations
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Reference to Next button for animations
  const nextButtonAnim = useRef(new Animated.Value(1)).current;
  
  // Track when all required photos are added
  const hasRequiredPhotos = images.filter((_, index) => 
    processingStatus[index] === 'approved').length >= 3;
  
  // Celebrate when user uploads required photos
  useEffect(() => {
    if (hasRequiredPhotos && images.length >= 3 && !showCelebration) {
      // Show celebration animation and vibrate
      setShowCelebration(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Hide celebration after a delay
      const timer = setTimeout(() => {
        setShowCelebration(false);
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [hasRequiredPhotos, images.length]);
  
  // Animate Next button when ready
  useEffect(() => {
    if (hasRequiredPhotos) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(nextButtonAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true
          }),
          Animated.timing(nextButtonAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      // Reset animation when not ready
      nextButtonAnim.setValue(1);
    }
  }, [hasRequiredPhotos]);

  useEffect(() => {
    const publicMetadata = user?.publicMetadata as any;
    const currentAvatarStatus = publicMetadata?.avatar_creation_status || 'pending';
    setAvatarStatus(currentAvatarStatus);
    
    if (currentAvatarStatus === 'pending' && !avatarGenerationStartTime) {
      setAvatarGenerationStartTime(Date.now());
    }
  }, [user, avatarGenerationStartTime]);

  useEffect(() => {
    // This useEffect will manage the styleProfileState in the context
    // to enable/disable the "Next" button in the parent onboarding screen.
    const approvedUrlImages = images.filter((image, index) =>
      processingStatus[index] === 'approved' && typeof image === 'string' && !image.startsWith('file:') && !image.startsWith('blob:')
    );
    const isValid = approvedUrlImages.length >= 3 && approvedUrlImages.length <= 5;
    dispatch({
      type: 'SET_PAYLOAD',
      payload: {
        key: 'styleProfileState',
        value: isValid ? {
          images: approvedUrlImages,
          processingStatus: processingStatus,
          rejectionReasons: rejectionReasons,
          progressValue: progressValue,
          avatarStatus: avatarStatus,
          avatarGenerationStartTime: avatarGenerationStartTime,
          isProcessing: isApiProcessing // Add the processing state
        } : null // Still set to null if not valid to disable Next button
      }
    });
  }, [images, processingStatus, rejectionReasons, progressValue, avatarStatus, avatarGenerationStartTime, isApiProcessing, dispatch]);
// 
//   useEffect(() => {
//     return () => {
//       images.forEach(imageUri => {
//         if (imageUri.startsWith('blob:')) {
//            URL.revokeObjectURL(imageUri); // Should only be called if createObjectURL was used for this URI
//         }
//       });
//     };
//   }, [images]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (avatarGenerationStartTime && avatarStatus && avatarStatus !== 'ready') {
      intervalId = setInterval(() => {
        const elapsedTime = Date.now() - avatarGenerationStartTime;
        const progress = Math.min((elapsedTime / 300000) * 100, 100); // 5-minute timer
        setProgressValue(progress);
        if (progress >= 100) {
          clearInterval(intervalId);
          // Consider re-fetching user metadata or setting status to needs-review
        }
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [avatarGenerationStartTime, avatarStatus]);

  const openNativeCamera = async () => {
    // Add haptic feedback when opening camera
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Toast.show({ type: 'error', text1: 'Camera permission denied', visibilityTime: 2000 });
      return;
    }
    
    // Instead of showing the modal, directly launch the camera
    try {
      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 0.7,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileUri = asset.uri;
        const fileName = asset.fileName || fileUri.split('/').pop() || 'camera_image.jpg';
        const fileType = asset.type || 'image/jpeg'; // Or derive from extension

        const fileToUpload = {
            uri: fileUri,
            name: fileName,
            type: fileType,
        };
        
        // Visual feedback before upload starts
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show({ type: 'info', text1: 'Processing your photo...', visibilityTime: 1500 });
        
        await addImage('camera', fileToUpload, fileUri);
      } else {
        Toast.show({ type: 'info', text1: 'Image capture cancelled or failed.', visibilityTime: 2000 });
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      // Add error haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Toast.show({ 
        type: 'error', 
        text1: 'Failed to open camera', 
        text2: 'Please check your app permissions in settings.',
        visibilityTime: 2000
      });
    }
  };

  // This function is now commented out as we're no longer using the CameraCapture modal
  /* const capturePhotoFromCamera = async () => {
    setIsCameraModalVisible(false); 

    let result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileUri = asset.uri;
        const fileName = asset.fileName || fileUri.split('/').pop() || 'camera_image.jpg';
        const fileType = asset.type || 'image/jpeg'; // Or derive from extension

        const fileToUpload = {
            uri: fileUri,
            name: fileName,
            type: fileType,
        };
        uploadImage(fileToUpload, fileUri);
    } else {
        Toast.show({ type: 'info', text1: 'Image capture cancelled or failed.' });
    }
  }; */

  const addImage = async (method: 'camera' | 'library' = 'library', file: { uri: string, name: string, type: string }, localDisplayUri: string) => {
    // Add light haptic feedback when starting image selection
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (images.length >= 5) {
      Toast.show({ type: 'error', text1: 'Maximum 5 images allowed.', visibilityTime: 2000 });
      return false;
    }

    let newImageIndex:any;
    setImages(prev => {
      newImageIndex = prev.length;
      console.log(`[uploadImage] Adding image at index ${newImageIndex}`);
      return [...prev, localDisplayUri]; // Store file object directly
    });
    
    // Wait for the state update to propagate
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Mark this index as processing
    setProcessingImageIndices(prev => {
      const newIndices = {...prev, [newImageIndex]: true};
      console.log(`[uploadImage] Updated processing indices: ${JSON.stringify(newIndices)}`);
      return newIndices;
    });
    
    try {
      const formData = new FormData();
      // Log the details from the file object being appended
      console.log(`Appending file object to FormData: name=${file.name}, type=${file.type || 'image/jpeg'}, uri=${file.uri}`);
      
      // Append the file object directly, casting to any for TypeScript
      formData.append('file', file as any); 
      
      console.log("FormData prepared."); 

      console.log("Attempting to call callPublicEndpoint('uploadImage')...");
      
      const data = await callProtectedEndpoint('uploadImage', { 
        method: 'POST',
        data: formData,
      });
      
      console.log("callPublicEndpoint finished. Response data:", data);

      if (!data || !data.secure_url) {
          console.error("Invalid response structure from uploadImage API:", data);
          throw new Error(data?.message || "Invalid response from image upload.");
      }
            
      setImages(prev => {
        const newImages = [...prev];
        if (newImageIndex < newImages.length) newImages[newImageIndex] = data.secure_url;
        return newImages;
      });
      setProcessingStatus(prev => ({ ...prev, [newImageIndex]: 'approved' }));
      console.log(`Image ${newImageIndex} approved and state updated.`);
      
      // Add success haptic feedback when image is added
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      return true;
    } catch (error: any) {
      console.error("Error caught in uploadImage function:", error);
      Toast.show({ type: 'error', text1: 'Upload Error', text2: error.message || 'Failed to upload image', visibilityTime: 2000 });
      setImages(prev => prev.filter((_, idx) => idx !== newImageIndex));
      return false;
    } finally {
      setProcessingImageIndices(prev => {
        const newIndices = { ...prev };
        delete newIndices[newImageIndex];
        return newIndices;
      });
    }
  };

  const removeImage = (indexToRemove: number) => {
    const imageUrlToRemove = images[indexToRemove];
    if (imageUrlToRemove.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrlToRemove);
    }

    setImages(prev => prev.filter((_, i) => i !== indexToRemove));
    
    const updateStateIndices = (prevState: Record<number, any>) => {
        const newState: Record<number, any> = {};
        Object.entries(prevState).forEach(([key, value]) => {
            const numKey = parseInt(key, 10);
            if (numKey < indexToRemove) newState[numKey] = value;
            else if (numKey > indexToRemove) newState[numKey - 1] = value;
        });
        return newState;
    };
    setProcessingStatus(updateStateIndices);
    setRejectionReasons(updateStateIndices);
    setProcessingImageIndices(updateStateIndices);
  };

  const handleFileSelectionFromLibrary = async () => {
    console.log('handleFileSelectionFromLibrary');
    // Add haptic feedback when opening gallery
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (images.length >= 5) {
      // Add error haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({ type: 'error', text1: 'Maximum 5 images allowed.', visibilityTime: 2000 });
      return;
    }
    
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      // Add error haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({ type: 'error', text1: 'Media Library permission denied', visibilityTime: 2000 });
      return;
    }

    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsMultipleSelection: true,
        quality: 0.7,
        selectionLimit: 5 - images.length,
      });
  
      if (!result.canceled && result.assets) {
        // Add success selection haptic feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        if (result.assets.length > 1) {
          Toast.show({ type: 'info', text1: `Processing ${result.assets.length} images... `, visibilityTime: 2000});
        }
        
        const uploadPromises = result.assets.map(asset => {
          const fileToUpload = {
              uri: asset.uri,
              name: asset.fileName || asset.uri.split('/').pop() || 'library_image.jpg',
              type: asset.type || 'image/jpeg',
          };
          return addImage('library', fileToUpload, asset.uri);
        });
        
        const results = await Promise.all(uploadPromises);
        
        const successCount = results.filter(res => res).length;
        if (successCount > 0) {
          // Add strong success haptic feedback for multiple image uploads
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Toast.show({ type: 'success', text1: `Successfully uploaded ${successCount} images.`, visibilityTime: 2000 });
        }
        
        if (results.length - successCount > 0) {
          // Add error haptic feedback for failed uploads
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Toast.show({ type: 'error', text1: `${results.length - successCount} uploads failed.`, visibilityTime: 2000 });
        }
      }
    } catch (error) {
      console.error('Error selecting from library:', error);
      // Add error haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({ 
        type: 'error', 
        text1: 'Failed to access photo library', 
        text2: String(error),
        visibilityTime: 2000
      });
    }
  };

  const validateForm = () => {
    const approvedUrlImages = images.filter((image, index) => 
      processingStatus[index] === 'approved' && typeof image === 'string' && !image.startsWith('file:') && !image.startsWith('blob:')
    );
    if (approvedUrlImages.length < 3 || approvedUrlImages.length > 5) {
      setErrors({ images: `Please upload and ensure 3 to 5 images are approved.` });
      return false;
    }
    setErrors({});
    return true;
  };

  // This is the function we want to expose via ref
  const handleNext = async () => {
    // Add medium haptic feedback when starting submission
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!validateForm()) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: errors.images || 'Please check the form.', visibilityTime: 2000 });
      return;
    }
    
    const approvedUrlImages = images.filter((image, index) => 
      processingStatus[index] === 'approved' && typeof image === 'string' && !image.startsWith('file:') && !image.startsWith('blob:')
    );
    
    if (approvedUrlImages.length < 3) {
      Toast.show({type: 'error', text1: 'Image Upload Issue', text2: `Ensure at least 3 images are fully uploaded and processed (found ${approvedUrlImages.length}).`, visibilityTime: 2000});
      return;
    }

    // Set loading and API processing states
    setIsLoading(true);
    setIsApiProcessing(true);
    
    try {
      console.log('Creating personalized avatar...', await getSavedDetails('gender') );
      // Use callProtectedEndpoint
      const response = await callProtectedEndpoint('createPersonalizedAvatar', {
        method: 'POST',
        data: {
          images: approvedUrlImages,
          gender: contextPayload.gender ||  await getSavedDetails('gender') || 'male'
        },
      });

      console.log('API Response:', response);

      // For non-success responses (like 400), check for validation data
      // We can detect this by checking for scored_images or error message
      if (response.error || response.scored_images || Array.isArray(response)) {
        console.log('Processing validation response:', response);
        
        // Handle validation response
        const imageResults = Array.isArray(response) 
          ? response 
          : response?.scored_images || [];
        
        if (imageResults.length > 0) {
          const resultsByUrl: Record<string, any> = {};
          imageResults.forEach((result: any) => {
            if (result.image_url) {
              const matchingIndex = images.findIndex(img => 
                (typeof img === 'string' && img === result.image_url) || 
                (typeof img !== 'string' && (img as any).uri === result.image_url)
              );
              if (matchingIndex !== -1) {
                resultsByUrl[matchingIndex] = result;
              }
            }
          });
          
          const newProcessingStatus = { ...processingStatus };
          const newRejectionReasons = { ...rejectionReasons };
          
          let hasRejectedImages = false;
          
          Object.entries(resultsByUrl).forEach(([indexStr, result]) => {
            const index = parseInt(indexStr, 10);
            if (result.reason) {
              newProcessingStatus[index] = 'rejected';
              newRejectionReasons[index] = result.reason;
              hasRejectedImages = true;
            } else {
              newProcessingStatus[index] = 'approved';
            }
          });
          
          // Apply the updates to state
          setProcessingStatus(newProcessingStatus);
          setRejectionReasons(newRejectionReasons);
          
          // Force the UI to refresh with the new statuses
          setValidationUpdateCount(prev => prev + 1);
          
          setIsLoading(false);
          setIsApiProcessing(false);
          
          setTimeout(() => {
            Toast.show({ 
              type: hasRejectedImages ? 'error' : 'info', 
              text1: hasRejectedImages ? 'Some images were rejected' : 'Image validation complete', 
              text2: hasRejectedImages 
                ? 'Please review flagged images and replace them before trying again.' 
                : 'Your images have been validated. You can proceed.',
                visibilityTime: 2000
            });
          }, 100);
          
          return;
        }
      }
      
      // Success case: API returned a success response
      Toast.show({ type: 'success', text1: response.message || 'Personalized avatar creation started', visibilityTime: 2000 });
      const newStyleProfileDataToSave = {
        images: [],
        processingStatus,
        rejectionReasons,
        progressValue,
        avatarStatus: 'pending',
        avatarGenerationStartTime: avatarGenerationStartTime || Date.now(),
        isProcessing: false // Reset processing state on success
      };
      dispatch({
        type: 'SET_PAYLOAD',
        payload: {
          key: 'styleProfileState',
          value: newStyleProfileDataToSave
        }
      });
      onNextProp({
        styleProfile: newStyleProfileDataToSave
      });
      
      // Add success haptic feedback when submission completes
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
    } catch (error: any) {
      setIsLoading(false);
      setIsApiProcessing(false);
      
      console.log('API Error Details:', error);
      
      // Only handle 401 or other non-4xx errors here, since 4xx are returned as normal responses now
      Toast.show({ 
        type: 'error', 
        text1: 'Avatar Creation Error', 
        text2: error.message || 'An unexpected error occurred' ,
        visibilityTime: 2000
      });
    } finally {
      dispatch({
        type: 'SET_PAYLOAD',
        payload: {
          key: 'styleProfileState',
          value: {
           ...contextPayload.styleProfileState,
            isProcessing: false
          } 
        }
      });
      // In case of errors we're already resetting isApiProcessing in the catch block
    }
  };

  // Expose the handleNext function as submitStep
  useImperativeHandle(ref, () => ({
    submitStep: handleNext
  }), [handleNext]); // Add handleNext to dependencies if it's not stable (e.g. uses props/state directly)
                      // In this case, handleNext uses many state variables, so it should be in the dep array.

  return (
    <>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContentContainer} keyboardShouldPersistTaps="handled">
        <MotiView 
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ duration: 300 }}
            style={styles.contentWrapper}
        >
          {/* Enhanced Gradient Header with Shimmer */}
          <View style={styles.headerContainer}>
            <View style={{ position: 'relative' }}>
              <MaskedView
                style={{ width: '100%', alignItems: 'center', marginBottom: 10 }}
                maskElement={
                  <Text style={[styles.sectionTitle, { color: '#000' }]}>
                    Upload 3-5 photos of yourself *
                  </Text>
                }
              >
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899', '#3B82F6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ height: 24, width: '100%' }}
                />
              </MaskedView>
              <ShimmerEffect />
            </View>
            
            <View style={styles.iconTextContainer}>
              <ImageIcon size={16} color="#8B5CF6" style={{ marginRight: 6 }} />
              <ThemedText style={styles.subheaderText}>Select clear, well-lit photos of your face and body</ThemedText>
              <Pressable 
                style={styles.helpButton}
                onPress={() => {
                  setActiveTooltip('photoTips');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                {/* <HelpCircle size={16} color="#8B5CF6" /> */}
              </Pressable>
              
              {/* Help tooltip */}
              {activeTooltip === 'photoTips' && (
                <Tooltip 
                  visible={true}
                  text="Choose photos with good lighting that clearly show your face and body. This helps us create the most accurate avatar."
                  position="bottom"
                  onClose={() => setActiveTooltip(null)}
                />
              )}
            </View>
          </View>
          
          {/* Progress Tracker with Animated Dots */}
          <View style={styles.progressTracker}>
            {[1, 2, 3, 4, 5].map(step => (
              <View key={`step-${step}`} style={styles.progressStep}>
                <PulsingDot 
                  active={images.length >= step} 
                  required={step <= 3} 
                />
                <ThemedText style={[
                  styles.progressText,
                  images.length >= step && styles.progressTextActive,
                  step <= 3 && styles.progressTextRequired
                ]}>
                  {step <= 3 ? `${step}` : `${step} (optional)`}
                </ThemedText>
              </View>
            ))}
          </View>
          
          {/* Celebration animation when all required photos are added */}
          <AnimatePresence>
            {showCelebration && (
              <MotiView
                from={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                style={styles.celebrationContainer}
              >
                <LinearGradient
                  colors={['rgba(139, 92, 246, 0.9)', 'rgba(236, 72, 153, 0.9)']}
                  style={styles.celebrationGradient}
                >
                  <Sparkles size={24} color="white" />
                  <ThemedText style={styles.celebrationText}>Looking good! Ready to create your avatar</ThemedText>
                </LinearGradient>
              </MotiView>
            )}
          </AnimatePresence>
          
          {/* Card Background for Image Grid */}
          <LinearGradient
            colors={['rgba(255,255,255,0.8)', 'rgba(245,243,255,0.6)']}
            style={styles.cardBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <ImageGrid
              key={`image-grid-${validationUpdateCount}`}
              images={images}
              processingImageIndices={processingImageIndices}
              processingStatus={processingStatus}
              rejectionReasons={rejectionReasons}
              removeImage={removeImage}
              startCamera={openNativeCamera}
              handleFileUpload={handleFileSelectionFromLibrary}
            />
          </LinearGradient>
          
          {errors.images && (<ThemedText style={styles.errorText}>{errors.images}</ThemedText>)}
            
          <PhotoRecommendations />
          
        </MotiView>
      </ScrollView>

      {/* Confetti celebration animation */}
      <ConfettiCelebration visible={showCelebration} />

      {isLoading && (
        <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)'}}>
            <ActivityIndicator size="large" color={theme.colors.primary.purple} />
        </View>
      )}
      
      {/* Animated Next Button */}
      {hasRequiredPhotos && (
        <Animated.View 
          style={[
            styles.nextButtonContainer,
            { transform: [{ scale: nextButtonAnim }] }
          ]}
        >
          <Pressable 
            style={styles.nextButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleNext();
            }}
          >
            <LinearGradient
              colors={['#8B5CF6', '#EC4899', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              <ThemedText style={styles.nextButtonText}>Continue</ThemedText>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      )}
    </>
  );
});

const styles = StyleSheet.create({
  scrollContainer: { flex: 1 },
  scrollContentContainer: { 
    paddingBottom: 120, 
    alignItems: 'flex-start',
    // paddingHorizontal: 20 
  },
  contentWrapper: { 
    width: '100%', 
    maxWidth: 600, 
    alignSelf: 'flex-start',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(55, 65, 81, 1)',
    marginBottom: 15,
    alignSelf: 'flex-start',
    paddingLeft: 5,
    width: '100%',
    lineHeight: 20,
    opacity: 1,
    marginTop: 20,
    marginLeft: 12,
  },
  errorText: { 
    fontSize: 13, 
    color: '#ef4444', 
    marginTop: 5, 
    marginBottom: 10, 
    marginLeft: 0,
    textAlign: 'center' 
  },
  
  progressSection: { marginVertical: 20, alignItems: 'center', width: '100%' },
  progressLoadingText: { marginBottom: 10, fontSize: 15, color: theme.colors.text },
  progressPercentageText: {position: 'absolute', alignSelf: 'center', fontSize: 12, fontWeight: 'bold', color: theme.colors.primary.white},

  statusChip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, marginTop: 15, alignSelf: 'center' },
  statusChipApproved: { backgroundColor: theme.colors.primary.bgGreen, borderWidth: 1, borderColor: theme.colors.primary.green },
  statusChipText: { marginLeft: 8, fontSize: 14, fontWeight: '500', color: theme.colors.primary.green },

  disabledButtonText: {
    color: theme.colors.secondary.darkGray,
  },
 
  headerContainer: {
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  iconTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingLeft: 5,
    position: 'relative',
  },
  subheaderText: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(75, 85, 99, 0.9)',
  },

  progressTracker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 30,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(209, 213, 219, 0.5)',
    marginBottom: 5,
  },
  progressDotActive: {
    backgroundColor: theme.colors.primary.purple,
  },
  progressDotRequired: {
    borderWidth: 1,
    borderColor: theme.colors.primary.purple,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(75, 85, 99, 0.8)',
  },
  progressTextActive: {
    color: theme.colors.primary.purple,
  },
  progressTextRequired: {
    fontWeight: '600',
  },

  cardBackground: {
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 15,
  },

  helpButton: {
    padding: 5,
    marginLeft: 5,
  },

  // Tooltip styles
  tooltipContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    width: 250,
    zIndex: 10,
    alignSelf: 'center',
  },
  tooltipBlur: {
    borderRadius: 10,
    padding: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tooltipText: {
    fontSize: 13,
    color: 'white',
    flex: 1,
    marginRight: 8,
  },
  tooltipCloseButton: {
    padding: 4,
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(0, 0, 0, 0.7)',
    alignSelf: 'center',
  },

  celebrationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  celebrationGradient: {
    position: 'absolute',
    top: '30%',
    left: 30,
    right: 30,
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  celebrationText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
    textAlign: 'center',
  },
  
  // Confetti styles
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    pointerEvents: 'none',
  },
  confettiSource: {
    position: 'absolute',
    width: 300,
    height: 300,
  },

  nextButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  nextButton: {
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  nextButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});

// Create a simple tooltip component for contextual help
interface TooltipProps {
  visible: boolean;
  text: string;
  position?: 'top' | 'bottom';
  onClose: () => void;
}

const Tooltip: React.FC<TooltipProps> = ({ visible, text, position = 'bottom', onClose }) => {
  if (!visible) return null;
  
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={[
        styles.tooltipContainer,
        position === 'top' && { bottom: '100%', marginBottom: 8 },
        position === 'bottom' && { top: '100%', marginTop: 8 }
      ]}
    >
      <BlurView intensity={90} style={styles.tooltipBlur}>
        <ThemedText style={styles.tooltipText}>{text}</ThemedText>
        <Pressable onPress={onClose} style={styles.tooltipCloseButton}>
          <XIcon size={15} color={theme.colors.primary.white} />
        </Pressable>
      </BlurView>
      <View 
        style={[
          styles.tooltipArrow,
          position === 'top' && { top: '100%', transform: [{ rotate: '180deg' }] },
          position === 'bottom' && { bottom: '100%' }
        ]} 
      />
    </MotiView>
  );
};

// Shimmer effect component for the header
const ShimmerEffect = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    shimmer.start();
    
    return () => shimmer.stop();
  }, []);
  
  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.3,
        transform: [{
          translateX: shimmerAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [-300, 300]
          })
        }]
      }}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ flex: 1 }}
      />
    </Animated.View>
  );
};

// Pulsing Dot Component for active progress indicators
interface PulsingDotProps {
  active: boolean;
  required: boolean;
}

const PulsingDot: React.FC<PulsingDotProps> = ({ active, required }) => {
  if (!active) {
    return (
      <View style={[
        styles.progressDot,
        required && styles.progressDotRequired,
      ]} />
    );
  }
  
  return (
    <MotiView
      style={[
        styles.progressDot,
        styles.progressDotActive,
        required && styles.progressDotRequired
      ]}
      from={{ scale: 1 }}
      animate={{ scale: [1, 1.1, 1] }}
      transition={{
        type: 'timing',
        duration: 2000,
        loop: true,
      }}
    />
  );
};

// Confetti celebration component
interface ConfettiCelebrationProps {
  visible: boolean;
}

const ConfettiCelebration: React.FC<ConfettiCelebrationProps> = ({ visible = false }) => {
  // Use a single ref for each animation to avoid ref recreation
  const leftConfettiRef = useRef<LottieView>(null);
  const rightConfettiRef = useRef<LottieView>(null);
  
  useEffect(() => {
    if (visible) {
      // Reset and play the animations when visibility changes
      if (leftConfettiRef.current) {
        // @ts-ignore - reset() and play() exist on LottieView but might not be recognized by TypeScript
        leftConfettiRef.current?.reset();
        // @ts-ignore
        leftConfettiRef.current?.play();
      }
      
      if (rightConfettiRef.current) {
        // @ts-ignore
        rightConfettiRef.current?.reset();
        // @ts-ignore
        rightConfettiRef.current?.play();
      }
    }
  }, [visible]);
  
  if (!visible) return null;
  
  return (
    <View style={styles.confettiContainer}>
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={StyleSheet.absoluteFillObject}
      >
        {/* Confetti from top left */}
        <View style={[styles.confettiSource, { top: 0, left: 0 }]}>
          <LottieView
            ref={leftConfettiRef}
            source={require('../../../assets/animations/confetti.json')}
            autoPlay
            loop={false}
            style={{ width: 300, height: 300 }}
          />
        </View>
        
        {/* Confetti from top right */}
        <View style={[styles.confettiSource, { top: 0, right: 0 }]}>
          <LottieView
            ref={rightConfettiRef}
            source={require('../../../assets/animations/confetti.json')}
            autoPlay
            loop={false}
            style={{ width: 300, height: 300 }}
          />
        </View>
      </MotiView>
    </View>
  );
};

export default StyleProfile; 