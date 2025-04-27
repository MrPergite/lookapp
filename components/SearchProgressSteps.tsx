import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutUp,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Check } from 'lucide-react-native';
import theme from "../styles/theme";
import { Image } from 'expo-image';
import { AnimatePresence } from "moti";

// Define types
interface StepProps {
  step: {
    title: string;
  };
  isActive: boolean;
  isCompleted: boolean;
  progress: number;
}

interface SearchProgressStepsProps {
  isLoading: boolean;
  onComplete?: () => void;
  steps?: Array<{ title: string }>;
  inputMode?: 'text' | 'img+txt' | 'imgurl+txt';
  isImageOnlySearch?: boolean;
  isSignedIn?: boolean;
}

// Default steps for image-only search
const imageOnlySearchSteps = [
  { title: "Analyzing the image" },
  { title: "Searching fashion database" },
];

// Updated ImageLoader with controlled dimensions and loading state
export const ImageLoader = ({ size = 32 }: { size?: number }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 2000,
        easing: Easing.linear,
      }),
      -1, // -1 for infinite
      false // don't reverse
    );
  }, []);



  return (
    <View style={styles.loadingContainer}>
      <Image
        source={{
          uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/eco-ai_2%20(1)-EEv5T7S8POoials0yFyAQ7XWwkOSm6.gif",
        }}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
    </View>
  );
};

// Step component with more dynamic animations
const Step = React.memo(
  ({ step, isActive, isCompleted, progress }: StepProps) => {
    // Animation values
    const scaleAnim = useSharedValue(1);
    const yAnim = useSharedValue(20);
    const opacityAnim = useSharedValue(0);
    const checkPathAnim = useSharedValue(0);
    const progressContainerWidth = useSharedValue(0);
    const progressWidthAnim = useSharedValue(0);

    // Initial enter animation
    useEffect(() => {
      yAnim.value = withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      });
      opacityAnim.value = withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      });
    }, []);

    // State-based animations
    useEffect(() => {
      if (isActive) {
        // Pulsing animation for active step
        scaleAnim.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 500 }),
            withTiming(1.05, { duration: 500 }),
            withTiming(1, { duration: 500 })
          ),
          -1,
          true
        );
        // Progress bar animations
        progressContainerWidth.value = withTiming(1, {
          duration: 2500,
          easing: Easing.linear
        });
        progressWidthAnim.value = withTiming(progress, {
          duration: 100,
          easing: Easing.linear
        });
      } else if (!isCompleted) {
        // Reset progress animations
        progressContainerWidth.value = 0;
        progressWidthAnim.value = 0;

        // Floating animation for pending steps
        yAnim.value = withRepeat(
          withSequence(
            withTiming(-2, {
              duration: 1500,
              easing: Easing.inOut(Easing.ease)
            }),
            withTiming(2, {
              duration: 1500,
              easing: Easing.inOut(Easing.ease)
            })
          ),
          -1,
          true
        );

        // Opacity and scale animation for pending steps
        opacityAnim.value = withRepeat(
          withSequence(
            withTiming(0.3, { duration: 1000 }),
            withTiming(0.6, { duration: 1000 })
          ),
          -1,
          true
        );
        scaleAnim.value = withRepeat(
          withSequence(
            withTiming(0.95, { duration: 1000 }),
            withTiming(1, { duration: 1000 })
          ),
          -1,
          true
        );
      } else if (isCompleted) {
        // Completed step animation
        scaleAnim.value = withTiming(1, {
          duration: 300,
          easing: Easing.out(Easing.ease),
        });
        yAnim.value = withTiming(0, {
          duration: 300,
          easing: Easing.out(Easing.ease),
        });
        opacityAnim.value = withTiming(1, { duration: 300 });
        checkPathAnim.value = withTiming(1, {
          duration: 500,
          easing: Easing.out(Easing.ease),
        });
        // Reset progress animations
        progressContainerWidth.value = 0;
        progressWidthAnim.value = 0;
      }
    }, [isActive, isCompleted, progress]);

    const containerAnimStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: scaleAnim.value },
        { translateY: yAnim.value },
      ],
      opacity: opacityAnim.value,
    }));

    const progressContainerStyle = useAnimatedStyle(() => ({
      width: `${progressContainerWidth.value * 100}%`
    }));

    const progressBarStyle = useAnimatedStyle(() => ({
      width: `${progressWidthAnim.value * 100}%`
    }));

    const checkmarkAnimStyle = useAnimatedStyle(() => ({
      opacity: checkPathAnim.value,
      transform: [{ scale: checkPathAnim.value }],
    }));

    return (
      <Animated.View
        style={[styles.stepContainer, containerAnimStyle]}
        entering={FadeIn.duration(500).withInitialValues({
          opacity: 0,
          transform: [{ translateY: 20 }]
        })}
        exiting={FadeOut.duration(500).withInitialValues({
          opacity: 1,
          transform: [{ translateY: 0 }]
        })}
      >
        <Animated.View style={[styles.iconContainer]}>
          {isCompleted ? (
            <View style={styles.completedCircle}>
              <Animated.View style={checkmarkAnimStyle}>
                <Check size={20} color={theme.colors.primary.green} strokeWidth={3} />
              </Animated.View>
            </View>
          ) : isActive ? (
            <ImageLoader />
          ) : (
            <Animated.View style={[styles.pendingCircle]} />
          )}
        </Animated.View>

        <Text className="text-sm font-medium text-gray-700 whitespace-prewrap text-center mb-2">
          {step.title}
        </Text>

        {isActive && (
          <Animated.View
            style={[styles.progressContainer, progressContainerStyle]}
            entering={FadeIn.duration(300)}
          >
            <Animated.View
              style={[styles.progressBar, progressBarStyle]}
            />
          </Animated.View>
        )}
      </Animated.View>
    );
  }
);

// Main component
const SearchProgressSteps = ({
  isLoading,
  onComplete,
  steps,
  inputMode,
  isImageOnlySearch,
  isSignedIn,
}: SearchProgressStepsProps) => {
  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const isMobile = Dimensions.get('window').width < 500;

  // Determine which steps to show
  const defaultSearchSteps = [
    { title: "Analyzing your request" },
    {
      title: isSignedIn
        ? "Applying your fashion profile"
        : "Applying fashion trends",
    },
    { title: "Searching products" },
    { title: "Generating recommendations" },
  ];

  const searchSteps =
    steps || (isImageOnlySearch ? imageOnlySearchSteps : defaultSearchSteps);

  // Progress timer effect
  useEffect(() => {
    if (!isLoading) {
      setIsComplete(true);
      onComplete?.();
      return;
    }

    const getDuration = () => {
      if (inputMode === "text") {
        return 5000;
      }
      return 8000;
    };

    // Adjust timing for image search vs regular search
    const totalDuration = isImageOnlySearch ? 10000 : getDuration();
    const stepDuration = totalDuration / searchSteps.length;
    const progressInterval = 50; // Smaller interval for smoother animation

    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        const newProgress = prevProgress + progressInterval / stepDuration;
        if (newProgress >= 1) {
          if (currentStep < searchSteps.length - 1) {
            setCurrentStep((prevStep) => prevStep + 1);
            return 0;
          } else {
            clearInterval(timer);
            setIsComplete(true);
            onComplete?.();
            return 1;
          }
        }
        return newProgress;
      });
    }, progressInterval);

    return () => clearInterval(timer);
  }, [
    currentStep,
    isLoading,
    onComplete,
    searchSteps.length,
    isImageOnlySearch,
    inputMode,
  ]);

  // Don't render when loading is complete
  if (!isLoading && isComplete) return null;

  return (
    <View
      style={styles.container}
    >
      <View className="rounded-xl bg-white/80 backdrop-blur-sm shadow-[0_2px_4px_rgba(0,0,0,0.1)] px-3 py-3">
        <AnimatePresence>
          <Step
            key={searchSteps[currentStep].title}
            step={searchSteps[currentStep]}
            isActive={true}
            isCompleted={false}
            progress={progress}
          />
        </AnimatePresence>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
    marginHorizontal: 16
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 1)",
    borderRadius: 12,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 80,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  stepsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: '100%',
  },
  stepContainer: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 8,
    marginVertical: 8,
    height: 54,
    marginBottom: 12,
    marginTop: -2,
  },
  iconContainer: {
    marginBottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
  },
  completedCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E6F7EF",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {

  },
  loadingImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  imagePlaceholder: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  pendingCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#d0d0d0",
    backgroundColor: 'transparent',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555555",
    textAlign: "center",
    marginBottom: 8,
    width: '100%',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
  },
  activeStepTitle: {
    color: "#333333",
    fontWeight: "600",
  },
  progressContainer: {
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 0,
  },
  progressBar: {
    height: "100%",
    backgroundColor: theme.colors.primary.green,
    borderRadius: 2,
  },
});

export default SearchProgressSteps; 