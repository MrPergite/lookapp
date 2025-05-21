import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
import { Loader } from 'lucide-react-native';
import theme from '@/styles/theme';

interface Step {
  title: string;
  isActive?: boolean;
}

interface SearchProgressStepsProps {
  steps: Step[];
  isLoading: boolean;
  inputMode?: 'text' | 'img+txt' | 'imgurl+txt';
}

// Separate animated loader component
export const ImageLoader = ({ size = 40 }: { size?: number }) => {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: 'timing',
        duration: 600,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }}
      style={styles.imageLoaderContainer}
    >
      <MotiView
        from={{ rotate: '0deg' }}
        animate={{ rotate: '360deg' }}
        transition={{
          loop: true,
          repeatReverse: false,
          type: 'timing',
          duration: 1500,
          easing: Easing.linear,
        }}
      >
        <Loader size={size} color={theme.colors.primary.purple} />
      </MotiView>
    </MotiView>
  );
};

const SearchProgressSteps: React.FC<SearchProgressStepsProps> = ({ steps, isLoading, inputMode = 'text' }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setCurrentStep((prevStep) => {
          if (prevStep < steps.length - 1) {
            return prevStep + 1;
          }
          return prevStep;
        });
      }, 3000); // Advance to next step every 3 seconds

      return () => clearInterval(interval);
    } else {
      setCurrentStep(0);
    }
  }, [isLoading, steps.length]);

  if (!isLoading) return null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      exit={{ opacity: 0, translateY: 20 }}
      transition={{ type: 'timing', duration: 500 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <ImageLoader size={28} />
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => {
            const isActive = index <= currentStep;
            
            return (
              <MotiView
                key={`step-${index}`}
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ 
                  type: 'timing', 
                  duration: 400,
                  delay: index * 200 
                }}
                style={styles.stepItem}
              >
                <MotiView
                  from={{ width: '0%' }}
                  animate={{ width: isActive ? '100%' : '0%' }}
                  transition={{ 
                    type: 'timing', 
                    duration: 1000,
                    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                  }}
                  style={[styles.progressBar, styles.progressBarActive]}
                />
                <Text style={[styles.stepText, isActive && styles.stepTextActive]}>
                  {step.title}
                </Text>
              </MotiView>
            );
          })}
        </View>
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginVertical: 8,
    marginHorizontal: 10,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  content: {
    alignItems: 'center',
  },
  imageLoaderContainer: {
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsContainer: {
    width: '100%',
  },
  stepItem: {
    marginBottom: 8,
    position: 'relative',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E9D5FF',
    borderRadius: 2,
    marginBottom: 8,
    width: '0%',
  },
  progressBarActive: {
    backgroundColor: '#8B5CF6',
  },
  stepText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  stepTextActive: {
    color: '#1F2937',
  },
});

export default SearchProgressSteps; 