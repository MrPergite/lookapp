import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal,
  Platform,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
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
  console.log('processingImageIndices', processingImageIndices)
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
    
    // console.log(`[ImageGrid] Item index: ${index}, isProcessing: ${isProcessing}, actualUri: ${actualUri}`); // Keep for debugging if needed
    
    return (
      <Pressable 
        key={`image-${index}`} 
        style={[styles.gridItem, { width: itemSize, height: itemSize }]} 
        onPress={() => actualUri && !isProcessing && setExpandedImageUri(actualUri)}
      >
        {actualUri ? (
          <Image 
            source={actualUri}
            style={[
              styles.image,
              status === 'rejected' && styles.rejectedImage,
              isProcessing && styles.processingImageBackground // Apply dimming style if processing
            ]}
            contentFit='cover'
            contentPosition='center'
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            {/* Show themed spinner in placeholder if this slot is processing */}
            {isProcessing ? (
              <ActivityIndicator color={theme.colors.primary.purple} size="small" />
            ) : (
              <ActivityIndicator /> // Default placeholder activity indicator
            )}
          </View>
        )}

        {isProcessing && (
          // This overlay sits on top of the (potentially dimmed) image or placeholder
          <View style={styles.processingOverlay}>
            <ActivityIndicator color={theme.colors.primary.purple} size="small" />
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
            e.stopPropagation();
            removeImage(index);
          }}
          style={styles.removeButton}
        >
          <XIcon size={14} color="white" />
        </Pressable>
      </Pressable>
    );
  };

  // Render Camera Button  
  const renderCameraButton = () => (
    <Pressable
      key="camera-button"
      onPress={startCamera}
      style={[styles.addButton, { width: itemSize, height: itemSize }]}
    >
      <CameraIcon size={24} color={theme.colors.primary.purple} />
      {/* <Text style={styles.addButtonText}>Camera</Text> */}
    </Pressable>
  );

  // Render Upload Button
  const renderUploadButton = () => (
    <Pressable
      key="upload-button"
      onPress={handleFileUpload}
      style={[styles.addButton, { width: itemSize, height: itemSize }]}
    >
      <UploadIcon size={24} color={theme.colors.primary.purple} />
      {/* <Text style={styles.addButtonText}>Upload</Text> */}
    </Pressable>
  );

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
      {expandedImageUri && (
        <Modal 
          visible={!!expandedImageUri} 
          transparent={true} 
          onRequestClose={() => setExpandedImageUri(null)}
          animationType="fade"
        >
          <Pressable style={styles.expandedImageBackdrop} onPress={() => setExpandedImageUri(null)}>
            <Image 
              source={expandedImageUri} 
              style={styles.expandedImage} 
              contentFit="contain"
              contentPosition='center'
            />
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
  container: {
    width: '100%',
    flexDirection: 'column',
    marginLeft:20
  },
  row: {
    flexDirection: 'row',
  },
  gridItem: {
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
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
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // Brighter, semi-transparent overlay
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8, // Match gridItem borderRadius
  },
  processingImageBackground: {
    opacity: 0.6, // Style to dim the image itself when processing
  },
  statusBadgeApproved: {
    position: 'absolute',
    top: 4,
    right: 4,
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
  }
});

export default ImageGrid; 