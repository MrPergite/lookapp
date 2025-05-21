import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, View, Text, Animated } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';

interface CategoryProps {
  name: string;
  onPress?: () => void;
}

const Category: React.FC<CategoryProps> = ({ name, onPress }) => {
  // Create animated values for ripple effect
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  
  // Animation function for the ripple effect
  const animateRipple = () => {
    // Reset animation values
    scaleAnim.setValue(1);
    backgroundOpacity.setValue(0);
    
    // Run animations in parallel
    Animated.parallel([
      // Scale animation with spring physics
      Animated.sequence([
        // Quick scale down
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        // Bounce back with spring physics
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        })
      ]),
      // Background flash effect
      Animated.sequence([
        Animated.timing(backgroundOpacity, {
          toValue: 0.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ])
    ]).start();
  };
  
  // Handle press with animation
  const handlePress = () => {
    animateRipple();
    
    // Call the original onPress handler after a small delay to let animation start
    if (onPress) {
      setTimeout(() => onPress(), 50);
    }
  };
  
  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }]
      }}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        className="flex-row items-center flex-wrap bg-white rounded-xl px-2 py-1 shadow-sm m-1"
        style={{ minWidth: 50 }}
      >
        {/* Ripple overlay */}
        <Animated.View 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#a259ff',
            opacity: backgroundOpacity,
            borderRadius: 12,
          }}
        />
        <View className="bg-purple-500/20 rounded-full p-2 mr-2">
          <ShoppingBag size={16} color="#a259ff" />
        </View>
        <Text className="text-md font-semibold text-black">
          {name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default Category; 