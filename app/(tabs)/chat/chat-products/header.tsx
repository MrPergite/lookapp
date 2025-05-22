import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet, Dimensions } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const Header = ({ darkMode=false }) => {
  // Animate opacity from 0→1 and translateY from −20→0
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  // Choose gradient colors based on darkMode
  const colors = darkMode
    ? ['#9F7AEA', '#ED64A6', '#4299E1'] as const
    : ['#6B46C1', '#D53F8C', '#2B6CB0'] as const;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: 1,
          transform: [{ translateY }],
        },
      ]}
    >
      <MaskedView
        maskElement={
          <Text style={[styles.text, styles.maskedText]} >
            what's your look?
          </Text>
        }
      >
        <LinearGradient
           colors={['#8B5CF6', '#EC4899', '#3B82F6']}

          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {/* Invisible text to size the gradient */}
          <Text style={[styles.text, { opacity: 0 }]}>
            what's your look?
          </Text>
        </LinearGradient>
      </MaskedView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 8,
    alignItems: 'center',
    marginTop: 32,
  },
  text: {
    // roughly matches web's text-2xl / sm:text-3xl
    fontSize: SCREEN_WIDTH > 360 ? 24 : 20,
    fontWeight:700,
    textAlign: 'center',
    lineHeight: 32,
  },
  maskedText: {
    // for MaskedView masks, text must have a color
    color: '#000',
    fontWeight:700,
  },
});

export default Header;
