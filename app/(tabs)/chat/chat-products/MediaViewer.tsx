import React, { useState, useEffect, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle } from 'react-native-svg';
import { MotiView, MotiText } from 'moti';
import { Sparkles } from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Types
interface ProgressCircleProps {
  progress: number;
}

interface EnhancedLoadingStateProps {
  progress: number;
  step: string;
}

interface ImageGalleryProps {
  images: { img_url: string }[];
  selectedImageIndex: number;
  onImageClick: (idx: number) => void;
}

interface MediaHeaderProps {
  isTikTok: boolean;
}

interface MediaViewerProps {
  post: { images: { img_url: string }[] };
  onImageClick: (idx: number) => void;
  selectedImageIndex: number;
  isTikTok?: boolean;
  hasFetchedUrl: boolean;
}

// ProgressCircle: Animated circular progress indicator
const ProgressCircle = memo(({ progress }: ProgressCircleProps) => {
  const size = 96;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (progress / 100) * circumference;

  return (
    <View style={styles.progressCircleContainer}>
      <Svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Circle
          stroke="#E9D5FF"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke="#A259FF"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          strokeLinecap="round"
        />
      </Svg>
      <MotiText
        style={styles.progressText}
        from={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'timing', duration: 400 }}
      >
        {Math.round(progress)}%
      </MotiText>
    </View>
  );
});

// EnhancedLoadingState: Shows animated progress and loading message
const EnhancedLoadingState = memo(({ progress, step }: EnhancedLoadingStateProps) => {
  return (
    <View style={styles.loadingCard}>
      <ProgressCircle progress={progress} />
      <View style={styles.sparkleRow}>
        <MotiView
          from={{ rotate: '0deg', scale: 1 }}
          animate={{ rotate: '360deg', scale: 1.2 }}
          transition={{ loop: true, type: 'timing', duration: 3000, repeatReverse: true }}
        >
          <Sparkles size={22} color="#A259FF" />
        </MotiView>
        <MotiText
          style={styles.loadingStep}
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
        >
          {step}
        </MotiText>
        <MotiView
          from={{ rotate: '0deg', scale: 1 }}
          animate={{ rotate: '360deg', scale: 1.2 }}
          transition={{ loop: true, type: 'timing', duration: 3000, repeatReverse: true, delay: 500 }}
        >
          <Sparkles size={22} color="#A259FF" />
        </MotiView>
      </View>
      <MotiText
        style={styles.loadingSubtext}
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 600, delay: 200 }}
      >
        Finding the perfect matches for you...
      </MotiText>
    </View>
  );
});

// ImageGallery: Simple horizontal gallery
const ImageGallery = ({ images, selectedImageIndex, onImageClick }: ImageGalleryProps) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryContainer}>
    {images.map((img: { img_url: string }, idx: number) => (
      <TouchableOpacity key={img.img_url} onPress={() => onImageClick(idx)}>
        <MotiView
          from={{ scale: 1 }}
          animate={{ scale: idx === selectedImageIndex ? 1.05 : 1 }}
          transition={{ type: 'timing', duration: 300 }}
          style={[styles.galleryImageWrapper, idx === selectedImageIndex && styles.selectedGalleryImageWrapper]}
        >
          <Image
            source={{ uri: img.img_url }}
            style={styles.galleryImage}
          />
        </MotiView>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

// MediaHeader: Placeholder for TikTok or other media info
const MediaHeader = ({ isTikTok }: MediaHeaderProps) => (
  <View style={styles.header}>
    <Text style={styles.headerText}>{isTikTok ? 'TikTok Media' : 'Media Viewer'}</Text>
  </View>
);

// Main MediaViewer component
export const MediaViewer = ({
  post,
  onImageClick,
  selectedImageIndex,
  isTikTok = false,
  hasFetchedUrl,
}: MediaViewerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Initializing media viewer...');

  useEffect(() => {
    if (hasFetchedUrl) {
      const loadingInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(loadingInterval);
            setTimeout(() => setIsLoading(false), 500);
            return 100;
          }
          return prev + 1;
        });
      }, 30);

      const messageInterval = setInterval(() => {
        setLoadingMessage(prevMessage => {
          switch (prevMessage) {
            case 'Initializing media viewer...': return 'Processing media...';
            case 'Processing media...': return 'Analyzing content...';
            case 'Analyzing content...': return 'Preparing display...';
            default: return 'Almost ready...';
          }
        });
      }, 750);

      return () => {
        clearInterval(loadingInterval);
        clearInterval(messageInterval);
      };
    }
  }, [hasFetchedUrl]);

  if (isLoading) {
    return <EnhancedLoadingState progress={loadingProgress} step={loadingMessage} />;
  }

  return (
    <View style={styles.card}>
      <MediaHeader isTikTok={isTikTok} />
      <ImageGallery
        images={post.images}
        selectedImageIndex={selectedImageIndex}
        onImageClick={onImageClick}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',

  },
  header: {
    marginBottom: 16,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#A259FF',
  },
  galleryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  galleryImageWrapper: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    marginHorizontal: 4,
    padding: 2,
  },
  selectedGalleryImageWrapper: {
    borderColor: '#A259FF',
    borderWidth: 3,
  },
  galleryImage: {
    width: 100,
    height: 120,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    margin: 16,
    alignItems: 'center',
    shadowColor: '#A259FF',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  progressCircleContainer: {
    width: 96,
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressText: {
    position: 'absolute',
    alignSelf: 'center',
    top: 36,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#A259FF',
  },
  sparkleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  loadingStep: {
    fontSize: 18,
    fontWeight: '600',
    color: '#A259FF',
    marginHorizontal: 8,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#A259FF',
    opacity: 0.7,
    textAlign: 'center',
  },
});

export default MediaViewer; 