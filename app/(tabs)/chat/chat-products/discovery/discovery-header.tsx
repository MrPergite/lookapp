import React, { useEffect, useRef } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  Dimensions
} from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DiscoveryHeaderProps {
  darkMode: boolean;
  discoveryOutfit?: any[];
}

export const DiscoveryHeader: React.FC<DiscoveryHeaderProps> = ({ darkMode, discoveryOutfit }) => {
 

  // Animated values for staggered fade-ins
  const headingOpacity = useRef(new Animated.Value(0)).current;
  const sub1Opacity = useRef(new Animated.Value(0)).current;
  const sub2Opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headingOpacity, {
      toValue: 1,
      duration: 500,
      delay: 200,
      useNativeDriver: true,
    }).start();
    Animated.timing(sub1Opacity, {
      toValue: 1,
      duration: 500,
      delay: 400,
      useNativeDriver: true,
    }).start();
    Animated.timing(sub2Opacity, {
      toValue: 1,
      duration: 500,
      delay: 500,
      useNativeDriver: true,
    }).start();
  }, [headingOpacity, sub1Opacity, sub2Opacity]);

  const gradientColors = ['#8B5CF6', '#EC4899', '#3B82F6']; // purple-600 → pink-500 → blue-500

  // Helper for gradient text
  const GradientText: React.FC<{ text: string; textStyle: any; opacityAnim?: Animated.Value }> = ({ text, textStyle, opacityAnim }) => (
    <Animated.View style={opacityAnim ? { opacity: opacityAnim } : undefined}>
      <MaskedView
        maskElement={<Text style={[textStyle, { color: '#000' }]}>{text}</Text>}
      >
        <LinearGradient
          colors={gradientColors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={[textStyle, { opacity: 0 }]}>{text}</Text>
        </LinearGradient>
      </MaskedView>
    </Animated.View>
  );

  return (discoveryOutfit && discoveryOutfit.length > 0)
    ? (
      <View style={styles.wrapper}>
        <GradientText
          text="outfits for you"
          textStyle={[
            styles.heading,
            { color: darkMode ? '#FFF' : '#111827' }
          ]}
          opacityAnim={headingOpacity}
        />

        <Animated.View style={[
          styles.subTextContainer, 
          { opacity: sub1Opacity } 
        ]}>
          <Text style={[styles.subTextBase, { color: darkMode ? '#9CA3AF' : '#6B7280' }]}>
            Based on your{' '}
          </Text>
          <GradientText
            text="LookPass"
            textStyle={[
              styles.subText,
              { color: darkMode ? '#FFF' : '#111827' }
            ]}
            opacityAnim={headingOpacity}
          />
          {/* <MaskedView 
            maskElement={
              <Text style={[styles.subTextBase, { fontWeight: '500' }]}>LookPass</Text>
            }
          >
            <LinearGradient
              colors={gradientColors as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.subTextBase, { fontWeight: '500' }]}>LookPass</Text>
            </LinearGradient>
          </MaskedView> */}
        </Animated.View>

        <View
          style={[
            styles.divider,
            { backgroundColor: darkMode ? 'rgba(196, 181, 253, 0.3)' : 'rgba(167, 139, 250, 0.3)' }
          ]}
        />
      </View>
    )
    : null;
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
    width: '100%',
  },
  heading: {
    fontSize: SCREEN_WIDTH > 360 ? 24 : 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subTextContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 12,
  },
  subTextBase: {
    fontSize: SCREEN_WIDTH > 360 ? 14 : 12,
  },
  subText: {
    fontSize: SCREEN_WIDTH > 360 ? 14 : 12,
    textAlign: 'center',
    marginBottom: 0,
    fontWeight: '500',
  },
  divider: {
    width: 128,
    height: 2,
    borderRadius: 1,
    marginTop: 0,
  },
  cardWrapper: {
    width: '48%',
    marginBottom: 16,
  },
});

export default DiscoveryHeader;
