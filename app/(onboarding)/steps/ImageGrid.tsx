import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ActivityIndicator,
  Modal,
  Platform,
  Dimensions
} from 'react-native';
import { X as XIcon, Check as CheckIcon, Camera as CameraIcon, Upload as UploadIcon, AlertCircle as AlertCircleIcon } from 'lucide-react-native';
import theme from '@/styles/theme'; // Assuming path is correct

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
  const isIOS = Platform.OS === 'ios';

  const getImageUrl = (image: string | { uri: string }) => {
    if (typeof image === 'string') return image;
    return image.uri;
  };

  const numColumns = 3;
  const screenWidth = Dimensions.get('window').width;

  // Define the horizontal padding applied by the parent component in style-profile.tsx
  const PARENT_HORIZONTAL_PADDING = 20;

  // Get grid's own padding (will be 0 or undefined after style change) and gap
  const containerPaddingHorizontal = styles.gridContainer.paddingHorizontal || 0;
  const gapSize = styles.gridContainer.gap || 0;

  // Calculate total padding from the grid container itself (should become 0)
  const totalGridOwnHorizontalPadding = containerPaddingHorizontal * 2;
  const totalGapWidth = gapSize * (numColumns - 1);

  // Calculate the effective width available for the grid container, after parent padding
  const effectiveWidthForGridContainer = screenWidth - (PARENT_HORIZONTAL_PADDING * 2);

  // Calculate the available width for items *within* the grid container.
  // This considers the effective width and subtracts the grid's own padding (which will be 0) and gaps.
  const availableWidth = effectiveWidthForGridContainer - totalGridOwnHorizontalPadding - totalGapWidth - 0.1;
  const itemSize = availableWidth / numColumns;

  return (
    <View style={styles.gridContainer}>
      {images.map((imgData, index) => {
        const imageUrl = getImageUrl(imgData);
        const isProcessing = processingImageIndices[index];
        const status = processingStatus[index];
        return (
          <Pressable key={index} style={[styles.gridItem, { width: itemSize, height: itemSize }]} onPress={() => imageUrl && !isProcessing && setExpandedImageUri(imageUrl)}>
            {imageUrl ? (
                <Image 
                    source={{ uri: imageUrl }}
                    style={[styles.image, status === 'rejected' && styles.rejectedImage]} 
                    resizeMode={isIOS ? 'cover' : 'cover'} 
                    width={itemSize}
                    height={itemSize}
                />
            ) : (
                <View style={styles.imagePlaceholder}><ActivityIndicator /></View> // Placeholder if URI is somehow null
            )}

            {isProcessing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator color="white" size="large" />
              </View>
            )}

            {status === 'approved' && (
              <View style={styles.statusBadgeApproved}>
                <CheckIcon size={12} color="white" />
              </View>
            )}

            {status === 'rejected' && (
              <RejectionPopover 
                reason={rejectionReasons[index] || "Image rejected"}
                trigger={
                    <View style={styles.statusBadgeRejected}>
                        <AlertCircleIcon size={18} color="white" />
                    </View>
                }
              />
            )}

            <Pressable 
              onPress={(e) => {
                e.stopPropagation(); // Prevent opening expanded view
                removeImage(index);
              }}
              style={styles.removeButton}
            >
              <XIcon size={14} color="white" />
            </Pressable>
          </Pressable>
        );
      })}

      {images.length < 5 && (
        <>
          <Pressable
            onPress={startCamera}
            style={[styles.addButton, { width: itemSize, height: itemSize }]}
          >
            <CameraIcon size={itemSize * 0.3} color={theme.colors.primary.purple} />
            <Text style={styles.addButtonText}>Camera</Text>
          </Pressable>

          <Pressable
            onPress={handleFileUpload}
            style={[styles.addButton, { width: itemSize, height: itemSize }]}
          >
            <UploadIcon size={itemSize * 0.3} color={theme.colors.primary.purple} />
            <Text style={styles.addButtonText}>Upload</Text>
          </Pressable>
        </>
      )}

      {expandedImageUri && (
        <Modal 
          visible={!!expandedImageUri} 
          transparent={true} 
          onRequestClose={() => setExpandedImageUri(null)}
          animationType="fade"
        >
          <Pressable style={styles.expandedImageBackdrop} onPress={() => setExpandedImageUri(null)}>
            <Image source={{ uri: expandedImageUri }} style={styles.expandedImage} resizeMode="contain" />
            <Pressable style={styles.closeExpandedButton} onPress={() => setExpandedImageUri(null)}>
              <XIcon size={24} color="white" />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  gridItem: {
    aspectRatio: 1,
    borderRadius: 8,
    // overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.secondary.mediumLightGray,
    backgroundColor: theme.colors.secondary.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary.lightGray,
  },
  rejectedImage: {
    opacity: 0.5,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadgeApproved: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: theme.colors.primary.green, // Use theme color for green
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
    top: 0, // Cover the whole item for tap
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(220, 53, 69, 0.7)', // Use theme color for red, with opacity
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 3,
  },
  addButton: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.primary.purple,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.lavender,
  },
  addButtonText: {
    fontSize: 10,
    color: theme.colors.primary.purple,
    marginTop: 4,
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
    height: '80%',
  },
  closeExpandedButton: {
    position: 'absolute',
    top: 40, // SafeArea consideration
    right: 20,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
  },
  // Popover styles
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
  }
});

export default ImageGrid; 