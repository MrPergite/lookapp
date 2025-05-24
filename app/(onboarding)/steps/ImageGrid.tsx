import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal,
  Platform,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { Image } from 'expo-image';
import { X as XIcon, Check as CheckIcon, Camera as CameraIcon, Upload as UploadIcon, AlertCircle as AlertCircleIcon, ZoomIn } from 'lucide-react-native';
import theme from '@/styles/theme'; // Assuming path is correct
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { ThemedText } from '@/components/ThemedText';

// Simple Popover/Modal for rejection reasons
const RejectionPopover: React.FC<{ reason: string, trigger: React.ReactNode }> = ({ reason, trigger }) => {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Pressable onPress={() => setVisible(true)}>{trigger}</Pressable>
      <Modal visible={visible} transparent={true} onRequestClose={() => setVisible(false)} animationType="fade">
        <Pressable style={styles.popoverBackdrop} onPress={() => setVisible(false)}>
          <View style={styles.popoverContent}>
            <Text style={styles.popoverText}>{reason}</Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

interface ImageGridProps {
  images: (string | { uri: string; type?: string; name?: string })[];
  processingImageIndices?: Record<number, boolean>;
  processingStatus?: Record<number, 'approved' | 'rejected' | string>; // More specific status
  rejectionReasons?: Record<number, string>;
  removeImage: (index: number) => void;
  startCamera: () => void;
  handleFileUpload: () => void; // Changed from expecting event to direct call
  // fileInputRef is not used in RN in the same way
}

const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  processingImageIndices = {},
  processingStatus = {},
  rejectionReasons = {},
  removeImage,
  startCamera,
  handleFileUpload,
}) => {
  const [expandedImageUri, setExpandedImageUri] = useState<string | null>(null);
  
  // Create animation references at the component level
  const cameraButtonAnim = useRef(new Animated.Value(1)).current;
  const uploadButtonAnim = useRef(new Animated.Value(1)).current;
  const imageAnims = useRef<{[key: number]: Animated.Value}>({}).current;
  
  // Get or create animation value for an index
  const getAnimValue = (index: number) => {
    if (!imageAnims[index]) {
      imageAnims[index] = new Animated.Value(1);
    }
    return imageAnims[index];
  };
  
  // Generic animation function
  const animatePress = (animValue: Animated.Value) => {
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  // Simple calculation for item size
  const screenWidth = Dimensions.get('window').width;
  const padding = 20; // Parent container padding
  const gap = 6; // Gap between items
  const numColumns = 3;
  
  // Available width for the grid content
  const availableWidth = screenWidth - (padding * 2);
  
  // Calculate item width: (available width - gaps) / 3 columns
  const itemSize = (availableWidth - (gap * (numColumns - 1))) / numColumns;
  
  // Render one image item
  const renderImageItem = (imgData: any, index: number) => {
    const actualUri = typeof imgData === 'string' ? imgData : imgData?.uri;
    const isProcessing = processingImageIndices[index];
    const status = processingStatus[index];
    const scaleAnim = getAnimValue(index);
    
    // Replace the useRef hook with a memoized value using the shared animation registry
    if (!imageAnims[`swipe-${index}`]) {
      imageAnims[`swipe-${index}`] = new Animated.Value(0);
    }
    const swipeAnim = imageAnims[`swipe-${index}`];
    
    // Create the interpolated opacity outside of render
    if (!imageAnims[`swipeOpacity-${index}`]) {
      imageAnims[`swipeOpacity-${index}`] = swipeAnim.interpolate({
        inputRange: [-100, 0, 100],
        outputRange: [0.2, 1, 0.2]
      });
    }
    const swipeOpacity = imageAnims[`swipeOpacity-${index}`];
    
    // Use a ref to store the PanResponder but don't create a new hook each render
    if (!imageAnims[`panResponder-${index}`]) {
      imageAnims[`panResponder-${index}`] = PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          // Only handle horizontal swipes to prevent interfering with scrolling
          return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dy) < 10;
        },
        onPanResponderMove: (_, gestureState) => {
          swipeAnim.setValue(gestureState.dx);
        },
        onPanResponderRelease: (_, gestureState) => {
          if (Math.abs(gestureState.dx) > 100) {
            // User swiped far enough to delete
            Animated.timing(swipeAnim, {
              toValue: gestureState.dx > 0 ? 500 : -500,
              duration: 300,
              useNativeDriver: true
            }).start(() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              removeImage(index);
            });
          } else {
            // Not enough to delete, spring back to center
            Animated.spring(swipeAnim, {
              toValue: 0,
              friction: 5,
              useNativeDriver: true
            }).start();
          }
        }
      });
    }
    const panResponder = imageAnims[`panResponder-${index}`];
    
    const handlePress = () => {
      animatePress(scaleAnim);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (actualUri && !isProcessing) {
        console.log("Setting expandedImageUri to:", actualUri);
        const normalizedUri = normalizeUri(actualUri);
        console.log("Normalized to:", normalizedUri);
        setExpandedImageUri(normalizedUri);
      }
    };
    
    const handleRemove = (e: any) => {
      e.stopPropagation();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Animate removal
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start(() => {
        removeImage(index);
      });
    };
    
    // Don't allow swiping rejected or processing images
    const canSwipe = !isProcessing && status !== 'rejected';
    
    return (
      <MotiView 
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 250, delay: index * 100 }}
        key={`image-${index}`}
      >
        <Animated.View 
          style={{ 
            transform: [
              { scale: scaleAnim },
              // Only apply swipe transform if allowed
              ...(canSwipe ? [{ translateX: swipeAnim }] : [])
            ],
            opacity: canSwipe ? swipeOpacity : 1
          }}
          {...(canSwipe ? panResponder.panHandlers : {})}
        >
          <Pressable 
            style={[styles.gridItem, { width: itemSize, height: itemSize }]} 
            onPress={handlePress}
          >
            {actualUri ? (
              <>
                <Image 
                  source={actualUri}
                  style={[
                    styles.image,
                    status === 'rejected' && styles.rejectedImage,
                    isProcessing && styles.processingImageBackground
                  ]}
                  contentFit='cover'
                  contentPosition='center'
                />
                <LinearGradient
                  colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0)']}
                  style={styles.imageGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 0.3 }}
                />
                
                {canSwipe && (
                  <MotiView 
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 500 }}
                    style={styles.swipeHintContainer}
                  >
                    <ThemedText style={styles.swipeHintText}>Swipe to delete</ThemedText>
                  </MotiView>
                )}
              </>
            ) : (
              <View style={styles.imagePlaceholder}>
                {isProcessing ? (
                  <ActivityIndicator color={theme.colors.primary.purple} size="small" />
                ) : (
                  <ActivityIndicator />
                )}
              </View>
            )}

            {isProcessing && (
              <MotiView 
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: 'timing', duration: 300, loop: true, repeatReverse: true }}
                style={styles.processingOverlay}
              >
                <ActivityIndicator color={theme.colors.primary.purple} size="small" />
                <Text style={styles.processingText}>Processing...</Text>
              </MotiView>
            )}

            {status === 'approved' && (
              <MotiView 
                from={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                style={styles.statusBadgeApproved}
              >
                <CheckIcon size={12} color="white" />
              </MotiView>
            )}

            {status === 'rejected' && (
              <RejectionPopover 
                reason={rejectionReasons[index] || "Image rejected"}
                trigger={
                  <MotiView 
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: 'timing', duration: 300 }}
                    style={styles.statusBadgeRejected}
                  >
                    <AlertCircleIcon size={18} color="white" />
                  </MotiView>
                }
              />
            )}

            <Pressable 
              onPress={handleRemove}
              style={styles.removeButton}
            >
              <XIcon size={14} color="white" />
            </Pressable>
          </Pressable>
        </Animated.View>
      </MotiView>
    );
  };

  // Render Camera Button  
  const renderCameraButton = () => {
    const handlePress = () => {
      animatePress(cameraButtonAnim);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      startCamera();
    };
    
    return (
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        key="camera-button"
      >
        <Animated.View style={{ transform: [{ scale: cameraButtonAnim }] }}>
          <Pressable
            onPress={handlePress}
            style={[styles.addButton, { width: itemSize, height: itemSize }]}
          >
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.15)', 'rgba(139, 92, 246, 0.05)']}
              style={styles.buttonGradient}
            />
            <CameraIcon size={24} color={theme.colors.primary.purple} />
            <Text style={styles.addButtonText}>Camera</Text>
          </Pressable>
        </Animated.View>
      </MotiView>
    );
  };

  // Render Upload Button
  const renderUploadButton = () => {
    const handlePress = () => {
      animatePress(uploadButtonAnim);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      handleFileUpload();
    };
    
    return (
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 15, delay: 100 }}
        key="upload-button"
      >
        <Animated.View style={{ transform: [{ scale: uploadButtonAnim }] }}>
          <Pressable
            onPress={handlePress}
            style={[styles.addButton, { width: itemSize, height: itemSize }]}
          >
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.15)', 'rgba(139, 92, 246, 0.05)']}
              style={styles.buttonGradient}
            />
            <UploadIcon size={24} color={theme.colors.primary.purple} />
            <Text style={styles.addButtonText}>Upload</Text>
          </Pressable>
        </Animated.View>
      </MotiView>
    );
  };

  // Create ref for modal animation
  const modalAnimValues = useRef({
    scale: new Animated.Value(1),
    translateX: new Animated.Value(0),
    translateY: new Animated.Value(0),
    pinchGesture: null
  }).current;
  
  // Initialize the pinch gesture handler once
  useEffect(() => {
    if (!modalAnimValues.pinchGesture) {
      modalAnimValues.pinchGesture = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (evt, gestureState) => {
          // Handle pinch to zoom
          if (evt.nativeEvent.changedTouches && evt.nativeEvent.changedTouches.length > 1) {
            const touch1 = evt.nativeEvent.changedTouches[0];
            const touch2 = evt.nativeEvent.changedTouches[1];
            
            // Calculate distance between touches
            const dx = touch1.pageX - touch2.pageX;
            const dy = touch1.pageY - touch2.pageY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Use distance to calculate scale factor (1.0 - 3.0)
            const newScale = Math.min(Math.max(distance / 200, 1), 3);
            modalAnimValues.scale.setValue(newScale);
          } else {
            // Handle panning when zoomed
            const currentScale = modalAnimValues.scale._value;
            if (currentScale > 1) {
              modalAnimValues.translateX.setValue(gestureState.dx);
              modalAnimValues.translateY.setValue(gestureState.dy);
            }
          }
        },
        onPanResponderRelease: () => {
          // Reset position if scale is back to normal
          const currentScale = modalAnimValues.scale._value;
          if (currentScale <= 1) {
            Animated.parallel([
              Animated.spring(modalAnimValues.translateX, { toValue: 0, useNativeDriver: true }),
              Animated.spring(modalAnimValues.translateY, { toValue: 0, useNativeDriver: true })
            ]).start();
          }
        }
      });
    }
  }, []);
  
  // Add a console log to troubleshoot
  useEffect(() => {
    if (expandedImageUri) {
      console.log("Image preview opened with URI:", expandedImageUri);
    }
  }, [expandedImageUri]);
  
  // Expanded Image Modal - Simplified version to ensure it works
  const renderExpandedImageModal = () => {
    if (!expandedImageUri) return null;
    
    const closePreview = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setExpandedImageUri(null);
    };
    
    // Log to help diagnose issues
    console.log("Rendering preview modal for URI:", expandedImageUri);
    
    return (
      <Modal 
        visible={true} 
        transparent={true} 
        onRequestClose={closePreview}
        animationType="fade"
      >
        <Pressable style={styles.expandedImageBackdrop} onPress={closePreview}>
          <View style={styles.imagePreviewHeader}>
            <ThemedText style={styles.imagePreviewTitle}>Photo Preview</ThemedText>
            <Pressable style={styles.closeExpandedButton} onPress={closePreview}>
              <XIcon size={24} color="white" />
            </Pressable>
          </View>
          
          {/* Use direct Image component for reliable display */}
          <View style={styles.previewImageContainer}>
            {expandedImageUri.startsWith('http') ? (
              // Remote image (HTTP/HTTPS)
              <Image
                source={{ uri: expandedImageUri }}
                style={styles.expandedImage}
                contentFit="contain"
                onError={() => console.error("Failed to load remote image:", expandedImageUri)}
              />
            ) : (
              // Local image fallback using standard React Native Image
              <Image
                source={{ uri: expandedImageUri }}
                style={styles.expandedImage}
                contentFit="contain"
                onError={() => console.error("Failed to load local image:", expandedImageUri)}
              />
            )}
          </View>
          
          <View style={styles.zoomInstructions}>
            <ThemedText style={styles.zoomInstructionsText}>Tap anywhere to close</ThemedText>
          </View>
        </Pressable>
      </Modal>
    );
  };

  // Enhanced debug logging
  useEffect(() => {
    console.log(`ImageGrid rendering with ${images.length} images`);
    images.forEach((img, i) => {
      const uri = typeof img === 'string' ? img : (img?.uri || 'unknown');
      console.log(`Image ${i}: ${uri.substring(0, 50)}${uri.length > 50 ? '...' : ''}`);
    });
  }, [images]);
  
  // Helper function to normalize URIs
  const normalizeUri = (uri: string | any): string => {
    if (!uri) return '';
    
    // Convert object to string URI
    let normalizedUri = typeof uri === 'string' ? uri : (uri.uri || '');
    
    // Log the URI for debugging
    console.log("Processing URI:", normalizedUri);
    
    // Fix common URI issues
    if (normalizedUri && !normalizedUri.startsWith('http') && 
        !normalizedUri.startsWith('file://') && 
        !normalizedUri.startsWith('data:')) {
      normalizedUri = `file://${normalizedUri.replace(/^file:\/\//, '')}`;
    }
    
    return normalizedUri;
  };

  // Prepare all items with images first
  const allItems = [...images.map((img, idx) => renderImageItem(img, idx))];
  
  // Add action buttons if we have room (fewer than 5 images)
  if (images.length < 5) {
    allItems.push(renderCameraButton());
    allItems.push(renderUploadButton());
  }

  // Calculate how many items per row
  const itemsPerRow = numColumns;
  const rows = Math.ceil(allItems.length / itemsPerRow);
      
  return (
    <View style={styles.container}>
      {/* Render items in rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <View 
          key={`row-${rowIndex}`} 
          style={[
            styles.row, 
            { gap, marginTop: rowIndex > 0 ? gap : 0 }
          ]}
        >
          {/* Get items for this row */}
          {allItems.slice(
            rowIndex * itemsPerRow, 
            Math.min((rowIndex + 1) * itemsPerRow, allItems.length)
          )}
        </View>
      ))}

      {/* Expanded Image Modal */}
      {renderExpandedImageModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'column',
    marginLeft: 0,
    marginVertical: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  gridItem: {
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(209, 213, 219, 0.5)',
    backgroundColor: theme.colors.secondary.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(209, 213, 219, 0.2)',
    borderRadius: 12,
  },
  rejectedImage: {
    opacity: 0.5,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  processingImageBackground: {
    opacity: 0.6,
  },
  statusBadgeApproved: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.colors.primary.green,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  statusBadgeRejected: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(220, 53, 69, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  addButton: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.5)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  addButtonText: {
    fontSize: 12,
    color: theme.colors.primary.purple,
    marginTop: 8,
    fontWeight: '500',
  },
  expandedImageBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  expandedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  closeExpandedButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
  },
  popoverBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  popoverContent: {
    backgroundColor: theme.colors.secondary.veryDarkGray,
    padding: 15,
    borderRadius: 8,
    maxWidth: '80%',
    alignItems: 'center',
  },
  popoverText: {
    color: theme.colors.primary.white,
    fontSize: 13,
    textAlign: 'center',
  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  processingText: {
    color: theme.colors.primary.white,
    fontSize: 10,
    marginTop: 4,
  },
  buttonGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  swipeHintContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeHintText: {
    color: theme.colors.primary.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  imagePreviewHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imagePreviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary.white,
  },
  zoomInstructions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomInstructionsText: {
    color: theme.colors.primary.white,
    fontSize: 12,
    marginLeft: 5,
  },
  previewImageContainer: {
    width: '100%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
});

export default ImageGrid; 