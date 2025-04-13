import React from 'react';
import { StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
const Spinner = () => {
  return (
    <LinearGradient
      colors={['#f6efff', '#ffffff']} // background similar to your screenshot
      style={styles.container}
    >
      <MotiView
        from={{ rotate: '0deg' }}
        animate={{ rotate: '360deg' }}
        transition={{
          loop: true,
          repeatReverse: false, // <-- ensures forward-only rotation
          duration: 1000,
          type: 'timing',
        }}
        style={styles.spinner}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6efff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    height: 48,
    width: 48,
    borderRadius: 24,
    borderTopWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#a855f7', // purple-500
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});

export default Spinner;
