import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence
} from "react-native-reanimated";
import theme from "../styles/theme";

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
  inputMode?: 'text' | 'image' | 'image+text';
  isImageOnlySearch?: boolean;
  isSignedIn?: boolean;
}

// Default steps for image-only search
const imageOnlySearchSteps = [
  { title: "Analyzing the image" },
  { title: "Searching fashion database" },
];

export const ImageLoader = () => {
  return (
    <View style={styles.loadingContainer}>
      <Image
        source={{
          uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/eco-ai_2%20(1)-EEv5T7S8POoials0yFyAQ7XWwkOSm6.gif",
        }}
        style={styles.loadingImage}
      />
    </View>
  );
};

// Step component
const Step = React.memo(
  ({ step, isActive, isCompleted, progress }: StepProps) => {
    // Animation values
    const scaleAnim = useSharedValue(1);
    const opacityAnim = useSharedValue(0.5);
    const checkmarkOpacity = useSharedValue(0);
    const yAnim = useSharedValue(0);

    // Set up animations based on step state
    useEffect(() => {
      if (isActive) {
        scaleAnim.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 500 }),
            withTiming(1.05, { duration: 500 }),
            withTiming(1, { duration: 500 })
          ),
          -1
        );
      } else if (!isCompleted) {
        yAnim.value = withRepeat(
          withSequence(
            withTiming(-2, { duration: 1000 }),
            withTiming(2, { duration: 1000 }),
            withTiming(-2, { duration: 1000 })
          ),
          -1
        );
        opacityAnim.value = withRepeat(
          withSequence(
            withTiming(0.3, { duration: 700 }),
            withTiming(0.6, { duration: 700 }),
            withTiming(0.3, { duration: 700 })
          ),
          -1
        );
      } else {
        // Completed animation
        scaleAnim.value = withTiming(1, { duration: 300 });
        if (isCompleted) {
          checkmarkOpacity.value = withTiming(1, { duration: 500 });
        }
      }
    }, [isActive, isCompleted, scaleAnim, opacityAnim, checkmarkOpacity, yAnim]);

    // Animated styles
    const circleAnimStyle = useAnimatedStyle(() => {
      return {
        transform: [
          { scale: scaleAnim.value },
          { translateY: yAnim.value },
        ],
        opacity: isCompleted || isActive ? 1 : opacityAnim.value,
      };
    });

    const progressAnimStyle = useAnimatedStyle(() => {
      return {
        width: `${progress * 100}%`,
      };
    });

    const checkmarkAnimStyle = useAnimatedStyle(() => {
      return {
        opacity: checkmarkOpacity.value,
      };
    });

    return (
      <View style={styles.stepContainer}>
        <Animated.View style={[styles.iconContainer, circleAnimStyle]}>
          {isCompleted ? (
            <View style={styles.completedCircle}>
              <Animated.Text style={[styles.checkmark, checkmarkAnimStyle]}>✓</Animated.Text>
            </View>
          ) : isActive ? (
            <ImageLoader />
          ) : (
            <View style={styles.pendingCircle} />
          )}
        </Animated.View>

        <Text style={styles.stepTitle}>{step.title}</Text>

        {isActive && (
          <View style={styles.progressContainer}>
            <Animated.View
              style={[styles.progressBar, progressAnimStyle]}
            />
          </View>
        )}
      </View>
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


  // For mobile, only show the current step
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Step
          key={searchSteps[currentStep].title}
          step={searchSteps[currentStep]}
          isActive={true}
          isCompleted={false}
          progress={progress}
        />
      </View>
    </View>
  );

};



const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginHorizontal: 16
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    height: 110
  },
  stepsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  stepContainer: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 4,
    marginVertical: 4,
  },
  iconContainer: {
    marginBottom: 8,
  },
  completedCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E6F7EF",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    fontSize: 18,
    color: "#4caf50",
    fontWeight: "bold",
  },
  loadingContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
  },
  loadingImage: {
    width: "100%",
    height: "100%",
  },
  pendingCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#d0d0d0",
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555555",
    textAlign: "center",
    marginBottom: 4,
  },
  progressContainer: {
    width: "100%",
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 4,
  },
  progressBar: {
    height: "100%",
    backgroundColor: theme.colors.primary.green,
    borderRadius: 2,
  },
});

export default SearchProgressSteps; 