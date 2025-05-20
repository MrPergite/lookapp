import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

const Disclaimer: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Look AI can make mistakes. shop at your own risk.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
  },
});

export default Disclaimer; 