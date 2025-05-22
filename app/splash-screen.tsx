import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationComplete }) => {
  // Animation values
  const lOpacity = useRef(new Animated.Value(0)).current;
  const lScale = useRef(new Animated.Value(0.5)).current;
  
  // First O - true coin rolling animation
  const firstOScale = useRef(new Animated.Value(0.3)).current; // Start smaller
  const firstOOpacity = useRef(new Animated.Value(0)).current;
  const firstOPosition = useRef(new Animated.Value(-20)).current; // Start at the horizontal part of L
  const firstORotateZ = useRef(new Animated.Value(0)).current; // For the actual rolling
  
  // Second O - true coin rolling animation
  const secondOScale = useRef(new Animated.Value(0.3)).current; // Start smaller
  const secondOOpacity = useRef(new Animated.Value(0)).current;
  const secondOPosition = useRef(new Animated.Value(-30)).current; // Start at the horizontal part of L
  const secondORotateZ = useRef(new Animated.Value(0)).current; // For the actual rolling
  
  const kOpacity = useRef(new Animated.Value(0)).current;
  const kScale = useRef(new Animated.Value(0.5)).current;
  const kPosition = useRef(new Animated.Value(20)).current;
  
  const dotOpacity = useRef(new Animated.Value(0)).current;
  const dotScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Step 1: L appears
    Animated.timing(lOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
    
    Animated.timing(lScale, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();

    // Step 2: First O rolls out from L (after delay)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(firstOOpacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        // Scale up as it rolls away from L
        Animated.timing(firstOScale, {
          toValue: 1, // Grow to full size
          duration: 700,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        // Horizontal movement
        Animated.timing(firstOPosition, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.cubic),
        }),
        // Rotation for rolling effect - multiple rotations
        Animated.timing(firstORotateZ, {
          toValue: 1080, // 3 full rotations
          duration: 700,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.cubic),
        }),
      ]).start();
    }, 600);

    // Step 3: Second O rolls out from L (with slight delay after first O)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(secondOOpacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        // Scale up as it rolls away from L
        Animated.timing(secondOScale, {
          toValue: 1, // Grow to full size
          duration: 700,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        // Horizontal movement
        Animated.timing(secondOPosition, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.cubic),
        }),
        // Rotation for rolling effect - multiple rotations
        Animated.timing(secondORotateZ, {
          toValue: 900, // 2.5 full rotations
          duration: 700, 
          useNativeDriver: true,
          easing: Easing.inOut(Easing.cubic),
        }),
      ]).start();
    }, 800);

    // Step 4: K appears (after both O's)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(kOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(kScale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(kPosition, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]).start();
    }, 1300);

    // Step 5: Dot appears and blinks
    setTimeout(() => {
      Animated.timing(dotScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(2)),
      }).start();

      // Blinking animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(dotOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dotOpacity, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dotOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 2 }
      ).start();
    }, 1800);

    // Step 6: Notify parent component that animation is complete
    setTimeout(() => {
      onAnimationComplete();
    }, 3000);
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#ffffff', '#f5f3ff', '#f0f9ff']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.logoContainer}>
        {/* Main logo letter positions are set up so that the "o"s can roll from the L's horizontal line */}
        
        {/* L - Positioned slightly left to make room for the rolling "o"s */}
        <Animated.Text 
          style={[
            styles.logoText, 
            styles.logoL,
            { 
              opacity: lOpacity,
              transform: [{ scale: lScale }]
            }
          ]}
        >
          L
        </Animated.Text>

        {/* First O - Starts small on L's horizontal line, then rolls and grows */}
        <Animated.Text 
          style={[
            styles.logoText, 
            styles.logoO1,
            { 
              opacity: firstOOpacity,
              position: 'relative',
              transform: [
                { scale: firstOScale },
                { translateX: firstOPosition },
                { rotateZ: firstORotateZ.interpolate({
                  inputRange: [0, 1080],
                  outputRange: ['0deg', '360deg']
                }) }
              ]
            }
          ]}
        >
          o
        </Animated.Text>

        {/* Second O - Starts small on L's horizontal line, then rolls and grows */}
        <Animated.Text 
          style={[
            styles.logoText, 
            styles.logoO2,
            { 
              opacity: secondOOpacity,
              position: 'relative',
              transform: [
                { scale: secondOScale },
                { translateX: secondOPosition },
                { rotateZ: secondORotateZ.interpolate({
                  inputRange: [0, 900],
                  outputRange: ['0deg', '360deg']
                }) }
              ]
            }
          ]}
        >
          o
        </Animated.Text>

        {/* K */}
        <Animated.Text 
          style={[
            styles.logoText, 
            styles.logoK,
            { 
              opacity: kOpacity,
              transform: [
                { scale: kScale },
                { translateX: kPosition }
              ]
            }
          ]}
        >
          k
        </Animated.Text>

        {/* Dot */}
        <Animated.Text 
          style={[
            styles.logoText, 
            styles.logoDot,
            { 
              opacity: dotOpacity,
              transform: [{ scale: dotScale }]
            }
          ]}
        >
          .
        </Animated.Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoText: {
    fontSize: 84,
    fontWeight: 'bold',
    // Subtle shadow for text
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  logoL: {
    color: '#9c5ef0', // Purple
  },
  logoO1: {
    color: '#a15bef', // Purple-ish
  },
  logoO2: {
    color: '#8462f2', // Purple-blue transition
  },
  logoK: {
    color: '#3b82f6', // Blue
  },
  logoDot: {
    color: '#38bdf8', // Light blue
    fontSize: 84,
    fontWeight: 'bold',
  },
});

export default SplashScreen; 