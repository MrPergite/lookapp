import { View, StyleSheet, useWindowDimensions, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

export default function CanvasContainer() {
  const { width } = useWindowDimensions();
  const scale = width >= 768 ? 1 : 0.7; // mimic md:scale-[1]

  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={[styles.container, { transform: [{ scale }] }]}>
      <Animated.View style={[styles.canvas, { opacity }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    aspectRatio: 1,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  canvas: {
    flex: 1,
    backgroundColor: '#eee', // placeholder color
    borderRadius: 8,
  },
});
