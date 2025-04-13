import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';

interface ImagePreviewProps {
  imageUris: string[];
  onRemoveImage: (uri: string) => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ imageUris, onRemoveImage }) => {
  const [containerHeight] = useState(new Animated.Value(0));
  const [containerOpacity] = useState(new Animated.Value(0));

  useEffect(() => {
    if (imageUris.length > 0) {
      // Animate in
      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(containerHeight, {
          toValue: 116, // 100px height + 8px padding top/bottom
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(containerHeight, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [imageUris.length]);

  const handleRemove = (uri: string) => {
    if (imageUris.length === 1) {
      // If it's the last image, animate the container out first
      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(containerHeight, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start(() => {
        onRemoveImage(uri);
      });
    } else {
      onRemoveImage(uri);
    }
  };

  if (imageUris.length === 0) return null;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          height: containerHeight,
          opacity: containerOpacity,
        },
      ]}
    >
      <ScrollView horizontal contentContainerStyle={styles.container}>
        {imageUris.map((uri, index) => (
          <View key={index} style={styles.imageContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => handleRemove(uri)}
            >
              <X size={16} color="white" />
            </TouchableOpacity>
            <Image
              source={{ uri: `data:image/jpeg;base64,${uri}` }}
              style={styles.image}
            />
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  container: {
    padding: 8,
    gap: 8,
    flexDirection: 'row',
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    position: 'relative',
    marginRight: 8,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  }
});

export default ImagePreview;
