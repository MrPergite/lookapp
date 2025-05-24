import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Shirt, Watch, Glasses, ShoppingBag, Footprints } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationComplete }) => {
  // Animation values for Look text animation
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
  
  // Fashion items circle animation
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const fashionItemsOpacity = useRef(new Animated.Value(0)).current;
  const fashionItemsScale = useRef(new Animated.Value(0.5)).current;
  
  // Individual fashion items animations for pulse effect
  const itemsScaleAnims = [
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
  ];

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
    
    // Step 6: Show fashion items circle (after logo animation)
    setTimeout(() => {
      // Fade in and scale up the fashion items
      Animated.parallel([
        Animated.timing(fashionItemsOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(fashionItemsScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.2)),
        }),
      ]).start();
      
      // Start rotating the circle of fashion items
      Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 6000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
      
      // Add pulsing effect to each fashion item
      itemsScaleAnims.forEach((anim, index) => {
        const pulseDelay = index * 300; // Stagger the pulse effect
        
        setTimeout(() => {
          Animated.loop(
            Animated.sequence([
              Animated.timing(anim, {
                toValue: 1.2,
                duration: 400,
                useNativeDriver: true,
                easing: Easing.out(Easing.sin),
              }),
              Animated.timing(anim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
                easing: Easing.in(Easing.sin),
              }),
              Animated.timing(anim, {
                toValue: 1,
                duration: 800, // Pause between pulses
                useNativeDriver: true,
              }),
            ])
          ).start();
        }, pulseDelay);
      });
    }, 2100);

    // Step 7: Notify parent component that animation is complete
    setTimeout(() => {
      onAnimationComplete();
    }, 4000);
  }, []);

  // Calculate positions for fashion items in a circle
  const fashionItems = [
    { icon: Shirt, color: '#9c5ef0', name: 'Shirt' },
    { icon: Glasses, color: '#a15bef', name: 'Glasses' },
    { icon: Watch, color: '#8462f2', name: 'Watch' },
    { icon: Footprints, color: '#3b82f6', name: 'Shoes' },
    { icon: ShoppingBag, color: '#38bdf8', name: 'Bag' },
  ];
  
  const circleRadius = 120; // Radius for orbit around the logo
  const rotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#ffffff', '#f5f3ff', '#f0f9ff']}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Rotating fashion items positioned AROUND the logo */}
      <Animated.View style={[
        styles.fashionItemsContainer,
        {
          opacity: fashionItemsOpacity,
          transform: [
            { scale: fashionItemsScale },
            { rotate: rotation }
          ]
        }
      ]}>
        {fashionItems.map((item, index) => {
          // Calculate position in circle
          const angle = (index / fashionItems.length) * 2 * Math.PI;
          const x = Math.cos(angle) * circleRadius;
          const y = Math.sin(angle) * circleRadius;
          
          const ItemIcon = item.icon;
          
          return (
            <Animated.View
              key={item.name}
              style={[
                styles.fashionItem,
                {
                  transform: [
                    { translateX: x },
                    { translateY: y },
                    { scale: itemsScaleAnims[index] }
                  ]
                }
              ]}
            >
              <ItemIcon size={32} color={item.color} />
            </Animated.View>
          );
        })}
      </Animated.View>
      
      {/* Main logo - positioned in the CENTER of the rotating items */}
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
                  outputRange: ['0deg', '1080deg']
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
                  outputRange: ['0deg', '900deg']
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
    zIndex: 10, // Make sure logo is above the rotating items
  },
  logoText: {
    fontSize: 72,
    fontWeight: 'bold',
    // Subtle shadow for text
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
    fontSize: 72,
    fontWeight: 'bold',
  },
  fashionItemsContainer: {
    position: 'absolute',
    width: 260, // Increased to give more space for items
    height: 260, // Increased to give more space for items
    justifyContent: 'center',
    alignItems: 'center',
  },
  fashionItem: {
    position: 'absolute',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
});

export default SplashScreen; 