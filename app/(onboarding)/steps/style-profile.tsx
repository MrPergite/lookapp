import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable, ActivityIndicator, Dimensions, Modal, Image } from 'react-native';
import { MotiView } from 'moti';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { Camera as CameraIcon, Check, Loader2 as Loader, X as XIcon } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import axios from 'axios';
import CameraCapture from './CameraCapture';
import ImageGrid from './ImageGrid';
import PhotoRecommendations from './PhotoRecommendations';

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
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Toast.show({ type: 'error', text1: 'Camera permission denied' });
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
        uploadImage(fileToUpload, fileUri);
      } else {
        Toast.show({ type: 'info', text1: 'Image capture cancelled or failed.' });
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Toast.show({ 
        type: 'error', 
        text1: 'Failed to open camera', 
        text2: 'Please check your app permissions in settings.'
      });
    }
    
    // No longer need to set this to true since we're not using the modal
    // setIsCameraModalVisible(true);
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

  const uploadImage = async (file: { uri: string, name: string, type: string }, localDisplayUri: string) => {
  
    if (images.length >= 5) {
      Toast.show({ type: 'error', text1: 'Maximum 5 images allowed.' });
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
      return true;
    } catch (error: any) {
      console.error("Error caught in uploadImage function:", error);
      Toast.show({ type: 'error', text1: 'Upload Error', text2: error.message || 'Failed to upload image' });
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
    if (images.length >= 5) {
      Toast.show({ type: 'error', text1: 'Maximum 5 images allowed.' });
      return;
    }
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Toast.show({ type: 'error', text1: 'Media Library permission denied' });
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: 5 - images.length,
    });
console.log(result);
    if (!result.canceled && result.assets) {
      if (result.assets.length > 1) {
        Toast.show({ type: 'info', text1: `Processing ${result.assets.length} images... `});
      }
      console.log(result.assets);
      const uploadPromises = result.assets.map(asset => {
        const fileToUpload = {
            uri: asset.uri,
            name: asset.fileName || asset.uri.split('/').pop() || 'library_image.jpg',
            type: asset.type || 'image/jpeg',
        };
        return uploadImage(fileToUpload, asset.uri);
      });
      
      const results = await Promise.all(uploadPromises);
      console.log('results',results);
      const successCount = results.filter(res => res).length;
      if (successCount > 0) Toast.show({ type: 'success', text1: `Successfully uploaded ${successCount} images.` });
      if (results.length - successCount > 0) Toast.show({ type: 'error', text1: `${results.length - successCount} uploads failed.` });
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
    if (!validateForm()) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: errors.images || 'Please check the form.' });
      return;
    }
    
    const approvedUrlImages = images.filter((image, index) => 
      processingStatus[index] === 'approved' && typeof image === 'string' && !image.startsWith('file:') && !image.startsWith('blob:')
    );
    
    if (approvedUrlImages.length < 3) {
      Toast.show({type: 'error', text1: 'Image Upload Issue', text2: `Ensure at least 3 images are fully uploaded and processed (found ${approvedUrlImages.length}).`});
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
                : 'Your images have been validated. You can proceed.'
            });
          }, 100);
          
          return;
        }
      }
      
      // Success case: API returned a success response
      Toast.show({ type: 'success', text1: response.message || 'Personalized avatar creation started' });
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
      
    } catch (error: any) {
      setIsLoading(false);
      setIsApiProcessing(false);
      
      console.log('API Error Details:', error);
      
      // Only handle 401 or other non-4xx errors here, since 4xx are returned as normal responses now
      Toast.show({ 
        type: 'error', 
        text1: 'Avatar Creation Error', 
        text2: error.message || 'An unexpected error occurred' 
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
          <ThemedText style={styles.sectionTitle}>Upload 3-5 photos of yourself *</ThemedText>
          
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
          
          {errors.images && (<ThemedText style={styles.errorText}>{errors.images}</ThemedText>)}
            
          <PhotoRecommendations />

          {/* {avatarStatus === 'pending' && avatarGenerationStartTime && (
            <View style={styles.progressSection}>
              <ThemedText style={styles.progressText}>Generating your avatar...</ThemedText>
              <Text style={styles.progressPercentageText}>{Math.round(progressValue)}%</Text>
            </View>
          )}
          {avatarStatus === 'completed' && (
             <View style={[styles.statusChip, styles.statusChipApproved]}>
                <Check size={16} color="green" />
                <ThemedText style={styles.statusChipText}>Avatar Ready!</ThemedText>
            </View>
          )} */}
          
        </MotiView>
      </ScrollView>

      {/* CameraCapture component is no longer needed since we're using ImagePicker directly
      <CameraCapture
        visible={isCameraModalVisible}
        onCapturePhoto={() => {}}
        onCancel={() => setIsCameraModalVisible(false)}
      />
      */}
      {isLoading && (
        <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)'}}>
            <ActivityIndicator size="large" color={theme.colors.primary.purple} />
        </View>
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
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(55 65 81  / 1)',
    marginBottom: 15,
    alignSelf: 'flex-start',
    paddingLeft: 5,
    width: '100%',
    lineHeight: 20,
    opacity:1,
    marginTop: 20,
    marginLeft: 12,
  },
  errorText: { fontSize: 13, color: '#ef4444', marginTop: 5, marginBottom: 10, marginLeft:0,textAlign: 'center' },
  
  progressSection: { marginVertical: 20, alignItems: 'center', width: '100%' },
  progressText: { marginBottom: 10, fontSize: 15, color: theme.colors.text },
  progressPercentageText: {position: 'absolute', alignSelf: 'center', fontSize: 12, fontWeight: 'bold', color: theme.colors.primary.white},

  statusChip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, marginTop: 15, alignSelf: 'center' },
  statusChipApproved: { backgroundColor: theme.colors.primary.bgGreen, borderWidth: 1, borderColor: theme.colors.primary.green },
  statusChipText: { marginLeft: 8, fontSize: 14, fontWeight: '500', color: theme.colors.primary.green },

  disabledButtonText: {
    color: theme.colors.secondary.darkGray,
  },
});

export default StyleProfile; 