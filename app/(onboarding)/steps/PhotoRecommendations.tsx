import React, { useState } from 'react';
import { View, StyleSheet, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Info as InfoIcon, ChevronDown as ChevronDownIcon } from 'lucide-react-native';
import { MotiView } from 'moti';
import theme from '@/styles/theme';
import { ThemedText } from '@/components/ThemedText';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PhotoRecommendations = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAccordion = () => {
    // Animate the layout change
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen(!isOpen);
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={toggleAccordion} style={styles.triggerContainer}>
        <View style={styles.triggerInner}>
          <InfoIcon size={18} color={theme.colors.primary.purple} />
          <ThemedText style={styles.triggerText}>Photo recommendations</ThemedText>
        </View>
        <MotiView
          animate={{ 
            rotate: isOpen ? '180deg' : '0deg',
          }}
          transition={{
            type: 'timing',
            duration: 300,
          }}
        >
        <ChevronDownIcon 
            size={20} 
            color={theme.colors.primary.purple} 
        />
        </MotiView>
      </Pressable>

      <MotiView
        animate={{ 
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{
          type: 'timing',
          duration: 300,
        }}
        style={[
          styles.contentWrapper,
          !isOpen && { overflow: 'hidden' }
        ]}
      >
        <View style={styles.contentContainer}>
          <ThemedText style={styles.contentTitle}>For best results:</ThemedText>
          <View style={styles.listContainer}>
            <ThemedText style={styles.listItem}>• Use a variety of images from different angles</ThemedText>
            <ThemedText style={styles.listItem}>• Upload images with different backgrounds</ThemedText>
            <ThemedText style={styles.listItem}>• Keep a consistent look – same hairstyle, makeup, etc.</ThemedText>
            <ThemedText style={styles.listItem}>• Mix full-body and close-up selfie images</ThemedText>
          </View>
        </View>
      </MotiView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'stretch',
    marginBottom: 20,
    marginTop: theme.spacing.lg,
    borderRadius: 8,
    overflow: 'hidden',
  },
  triggerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  triggerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(147 51 234 / 1)',
    textAlign: 'left',
    marginRight: 8,
    textDecorationLine: 'underline',
    marginLeft:0
  },
  contentWrapper: {
    width: '100%',
  },
  contentContainer: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  contentTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(75 85 99  / 1)',
    marginBottom: 10,
    textAlign: 'left',
    paddingLeft: 2,
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;',
  },
  listContainer: {
    gap: 8,
    paddingLeft: 2,
  },
  listItem: {
    fontSize: 12,
   color: 'rgba(75 85 99  / 1)',
    lineHeight: 16,
    textAlign: 'left',
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;',
  },
});

export default PhotoRecommendations; 