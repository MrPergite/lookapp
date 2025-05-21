import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Loader } from 'lucide-react-native'; // Renamed to Loader2 to match previous usage
import theme from '@/styles/theme'; // Assuming theme is accessible here
import { useOnBoarding } from '../context';

interface AvatarCreationProgressCardProps {
  isProcessing: boolean;
  progressStartTime: number | null; // Timestamp when processing started
}

const AvatarCreationProgressCard: React.FC<AvatarCreationProgressCardProps> = ({ 
  isProcessing,
  progressStartTime 
}) => {
  const [currentProgress, setCurrentProgress] = useState(0);
  const animatedProgressWidth = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [mockStartTime] = useState(() => Date.now()); 
  const { dispatch, payload } = useOnBoarding();
  const [avatarCreationProgress, setAvatarCreationProgress] = useState(0);

  const _avatarGenerationStartTime = payload.styleProfileState?.avatarGenerationStartTime || mockStartTime; 
  useEffect(() => {
    let progressInterval: NodeJS.Timeout | undefined = undefined;
    if (isProcessing && typeof _avatarGenerationStartTime === 'number') {
        const calculateProgress = () => {
            const now = Date.now();
            const startTime = _avatarGenerationStartTime as number;
            const elapsedTime = now - startTime;
            const progress = Math.min((elapsedTime / (5 * 60 * 1000)) * 100, 100);                
            setAvatarCreationProgress(progress);
            if (progress >= 100) {
                if (progressInterval) {
                    console.log('[ProgressCalc] Progress >= 100, clearing interval.');
                    clearInterval(progressInterval);
                }
            }
        };
        calculateProgress();
        progressInterval = setInterval(calculateProgress, 1000);
    } else {
        setAvatarCreationProgress(0);
    }
    return () => {
        if (progressInterval) clearInterval(progressInterval);
    };
}, [isProcessing, _avatarGenerationStartTime]);
//   useEffect(() => {
//     let progressInterval: NodeJS.Timeout | undefined = undefined;

//     if (isProcessing && typeof progressStartTime === 'number') {
//       rotateAnim.setValue(0);
//       Animated.loop(
//         Animated.timing(rotateAnim, {
//           toValue: 1,
//           duration: 1000,
//           easing: Easing.linear,
//           useNativeDriver: true, // Usually fine for rotation
//         })
//       ).start();

//       const calculateProgress = () => {
//         const now = Date.now();
//         const startTime = progressStartTime as number;
//         const elapsedTime = now - startTime;
//         const progress = Math.min((elapsedTime / (5 * 60 * 1000)) * 100, 100); // 5 minutes total
//         setCurrentProgress(progress);
//         if (progress >= 100) {
//           if (progressInterval) clearInterval(progressInterval);
//         }
//       };
//       calculateProgress();
//       progressInterval = setInterval(calculateProgress, 1000);

//     } else {
//       rotateAnim.stopAnimation?.();
//       rotateAnim.setValue(0);
//       setCurrentProgress(0);
//     }

//     return () => {
//       if (progressInterval) clearInterval(progressInterval);
//       rotateAnim.stopAnimation?.();
//     };
//   }, [isProcessing, progressStartTime, rotateAnim]);


useEffect(() => {
    Animated.timing(animatedProgressWidth, {
        toValue: avatarCreationProgress,
        duration: 300,
        useNativeDriver: false,
    }).start();
}, [avatarCreationProgress, animatedProgressWidth]);

  
  useEffect(() => {
    Animated.loop(
        Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.linear,
            useNativeDriver: true,
        })
    ).start();
}, []);
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
});

  if (!isProcessing) {
    return null; // Don't render anything if not processing
  }

  return (
    <View style={styles.processingCardContainer}>
      <LinearGradient
       colors={['#8B5CF6', '#EC4899', '#3B82F6']}

        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.creatingCard}
      >
        <View style={styles.creatingRow}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
                            <Loader size={24} color="#d946ef" />
                        </Animated.View>
          <Text style={styles.creatingText}>Creating your avatar in the background</Text>
        </View>
        <View style={styles.creatingProgressBarTrack}>
          <Animated.View
            style={[
              styles.creatingProgressBarFill,
              {
                width: animatedProgressWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%']
                })
              }
            ]}
          />
        </View>
        {/* Optional: Debug Text for Progress */}
        {/* <Text style={{fontSize: 10, color: 'gray', textAlign: 'center', marginTop: 5}}>
          Debug - Progress: {currentProgress.toFixed(1)}%
        </Text> */}
      </LinearGradient>
    </View>
  );
};

// Styles are copied from DisplayCustomAvatars.tsx and slightly adjusted
const styles = StyleSheet.create({
  processingCardContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16, 
    width: '100%',
  },
  creatingCard: {
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    width: '100%',
    maxWidth: 500, 
  },
  creatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  creatingText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#a855f7', 
  },
  creatingProgressBarTrack: {
    height: 8,
    backgroundColor: '#f3e8ff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  creatingProgressBarFill: {
    height: '100%',
    backgroundColor: '#d946ef',
  },
});

export default AvatarCreationProgressCard; 