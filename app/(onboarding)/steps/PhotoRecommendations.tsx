import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Info as InfoIcon, ChevronDown as ChevronDownIcon } from 'lucide-react-native';
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
        <ChevronDownIcon 
            size={20} 
            color={theme.colors.primary.purple} 
            style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }} 
        />
      </Pressable>

      {isOpen && (
        <View style={styles.contentContainer}>
          <ThemedText style={styles.contentTitle}>For best results:</ThemedText>
          <View style={styles.listContainer}>
            <ThemedText style={styles.listItem}>• Use a variety of images from different angles</ThemedText>
            <ThemedText style={styles.listItem}>• Upload images with different backgrounds</ThemedText>
            <ThemedText style={styles.listItem}>• Keep a consistent look – same hairstyle, makeup, etc.</ThemedText>
            <ThemedText style={styles.listItem}>• Mix full-body and close-up selfie images</ThemedText>
          </View>
        </View>
      )}
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
  },
  triggerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary.purple,
    textAlign: 'left',
    marginRight: 8,
    textDecorationLine: 'underline',
  },
  contentContainer: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  contentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 10,
    textAlign: 'left',
    paddingLeft: 2,
  },
  listContainer: {
    gap: 8,
    paddingLeft: 2,
  },
  listItem: {
    fontSize: 12,
    color: theme.colors.secondary.darkGray,
    lineHeight: 20,
    textAlign: 'left',
  },
});

export default PhotoRecommendations; 