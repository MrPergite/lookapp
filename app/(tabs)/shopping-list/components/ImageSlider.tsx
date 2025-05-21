import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Text, Platform } from 'react-native';
import { AnimatePresence, MotiImage, MotiView } from 'moti';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';

const ImageCache = {
  _cache: {},
  
  // Get the cached path for an image URL
  get: (url) => {
    return ImageCache._cache[url];
  },
  
  // Save the cached path for an image URL
  set: (url, path) => {
    ImageCache._cache[url] = path;
  }
};

// Generate a unique file name for caching
const getImageFileName = (url) => {
  return url.substring(url.lastIndexOf('/') + 1)
    .split('?')[0] // Remove query params
    .replace(/[^a-zA-Z0-9.]/g, ''); // Remove invalid characters
};

// Check if FileSystem is available (in Expo)
const hasFileSystem = !!FileSystem;

export default function ImageSlider({ images = [], productTitle = '' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [preloaded, setPreloaded] = useState({});
  const [prevIndex, setPrevIndex] = useState(null);
  const [cachedImages, setCachedImages] = useState({});
  const [loadingProgress, setLoadingProgress] = useState(0);
  const mountedRef = useRef(true);

  // Clean up local cached images that aren't needed
  const cleanupCache = async () => {
    if (!hasFileSystem) return;
    
    try {
      const cacheDir = `${FileSystem.cacheDirectory}images/`;
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      
      if (dirInfo.exists) {
        const contents = await FileSystem.readDirectoryAsync(cacheDir);
        // If cache grows too large, we could implement cleanup logic here
      }
    } catch (error) {
      console.log('Error cleaning image cache:', error);
    }
  };

  // Load and cache an image
  const cacheImage = async (url) => {
    if (!hasFileSystem || !url) return url;
    
    try {
      // Check if we already cached this image
      const cachedImage = ImageCache.get(url);
      if (cachedImage) {
        return cachedImage;
      }
  
      // Create cache directory if it doesn't exist
      const cacheDir = `${FileSystem.cacheDirectory}images/`;
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
      }
  
      // Download the image
      const fileName = getImageFileName(url);
      const filePath = `${cacheDir}${fileName}`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
  
      if (!fileInfo.exists) {
        const downloadResult = await FileSystem.downloadAsync(url, filePath, {
          // Track download progress
          progressInterval: 100,
          headers: {
            // Adding fake User-Agent to bypass some server restrictions
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
          },
        });
        
        if (downloadResult.status !== 200) {
          return url;
        }
      }
  
      // Save to cache and return local URI
      ImageCache.set(url, filePath);
      
      if (mountedRef.current) {
        setCachedImages(prev => ({ ...prev, [url]: filePath }));
      }
      
      return filePath;
    } catch (error) {
      console.log('Error caching image:', error);
      return url;
    }
  };

  // Preload and cache images
  useEffect(() => {
    const preloadImages = async () => {
      if (!images.length) return;
      
      // First cache the current image
      if (images[currentIndex]) {
        await cacheImage(images[currentIndex]);
        if (mountedRef.current) {
          setPreloaded(prev => ({ ...prev, [images[currentIndex]]: true }));
        }
      }
      
      // Then preload other images in the background
      for (let i = 0; i < images.length; i++) {
        if (i !== currentIndex && images[i]) {
          cacheImage(images[i]).then(() => {
            if (mountedRef.current) {
              setPreloaded(prev => ({ ...prev, [images[i]]: true }));
            }
          });
        }
      }
    };
    
    preloadImages();
    
    return () => {
      mountedRef.current = false;
    };
  }, [images]);

  // When changing images, ensure the next image is loaded
  useEffect(() => {
    if (images[currentIndex]) {
      cacheImage(images[currentIndex]);
    }
  }, [currentIndex]);

  const goNext = () => {
    if (images.length <= 1) return;
    setPrevIndex(currentIndex);
    const next = (currentIndex + 1) % images.length;
    if (!preloaded[images[next]]) setImageLoaded(false);
    setCurrentIndex(next);
  };
  
  const goPrev = () => {
    if (images.length <= 1) return;
    setPrevIndex(currentIndex);
    const prev = (currentIndex - 1 + images.length) % images.length;
    if (!preloaded[images[prev]]) setImageLoaded(false);
    setCurrentIndex(prev);
  };

  // Get the appropriate image source - cached local URI or remote URL
  const getImageSource = (url) => {
    const cachedPath = cachedImages[url];
    return { uri: cachedPath || url };
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setLoadingProgress(1);
  };

  const handleLoadStart = () => {
    setLoadingProgress(0);
  };

  const handleProgress = (e) => {
    if (e.nativeEvent.loaded && e.nativeEvent.total) {
      const progress = e.nativeEvent.loaded / e.nativeEvent.total;
      setLoadingProgress(progress);
    }
  };

  return (
    <View style={styles.container}>
      {/* Placeholder with gradient */}
      <View style={styles.backgroundPlaceholder}>
        {!imageLoaded && !preloaded[images[currentIndex]] && (
          <View style={styles.placeholderContent}>
            <ImageIcon size={40} color="#d1d5db" />
            {productTitle ? (
              <Text style={styles.placeholderText} numberOfLines={2}>
                {productTitle}
              </Text>
            ) : null}
          </View>
        )}
      </View>

      {/* Loading indicator */}
      {!imageLoaded && !preloaded[images[currentIndex]] && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#9b87f5" />
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${loadingProgress * 100}%` }]} />
          </View>
        </View>
      )}

      {/* Image display */}
      {images.length > 0 && (
        <AnimatePresence exitBeforeEnter>
          <MotiImage
            key={currentIndex}
            from={{ opacity: 0 }}
            animate={{ opacity: imageLoaded ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'timing', duration: 300 }}
            source={images}
            style={styles.image}
            onLoadStart={handleLoadStart}
            onProgress={handleProgress}
            onLoad={handleImageLoad}
            
            // Enable progressive JPEG loading on supported platforms
            progressiveRenderingEnabled={true}
          />
        </AnimatePresence>
      )}

      {/* Navigation buttons */}
      {images.length > 1 && (
        <>
          <TouchableOpacity style={styles.navButtonLeft} onPress={goPrev}>
            <ChevronLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButtonRight} onPress={goNext}>
            <ChevronRight size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.pagination}>
            {images.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  idx === currentIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6', // bg-gray-100
  },
  backgroundPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F9FAFB', // Lighter background for placeholder
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  progressContainer: {
    width: '70%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#9b87f5',
    borderRadius: 2,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    zIndex: 1,
  },
  navButtonLeft: {
    position: 'absolute',
    left: 16,
    top: '50%',
    marginTop: -16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  navButtonRight: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  pagination: {
    position: 'absolute',
    bottom: 16,
    left: '50%',
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 15,
    transform: [{ translateX: -50 }],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
});
