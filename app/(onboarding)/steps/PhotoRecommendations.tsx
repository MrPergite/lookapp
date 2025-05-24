import React, { useState } from 'react';
import { View, StyleSheet, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Info as InfoIcon, ChevronDown as ChevronDownIcon, Camera as CameraIcon } from 'lucide-react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import theme from '@/styles/theme';
import { ThemedText } from '@/components/ThemedText';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PhotoRecommendations = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAccordion = () => {
    // Add light haptic feedback when toggling accordion
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Animate the layout change
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen(!isOpen);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(255,255,255,0.9)', 'rgba(235,233,255,0.6)']}
        style={styles.gradientContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
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
              {[
                'Use a variety of images from different angles',
                'Upload images with different backgrounds',
                'Keep a consistent look – same hairstyle, makeup, etc.',
                'Mix full-body and close-up selfie images',
                'Ensure your face is clearly visible'
              ].map((item, index) => (
                <MotiView
                  key={`tip-${index}`}
                  from={{ opacity: 0, translateX: -10 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ delay: index * 100, type: 'timing', duration: 300 }}
                  style={styles.listItemContainer}
                >
                  <View style={styles.bulletPoint} />
                  <ThemedText style={styles.listItem}>{item}</ThemedText>
                </MotiView>
              ))}
            </View>
            
         
          </View>
        </MotiView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'stretch',
    marginBottom: 20,
    marginTop: theme.spacing.lg,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(209, 213, 219, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  triggerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
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
    fontWeight: '600',
    color: theme.colors.primary.purple,
    textAlign: 'left',
    marginRight: 8,
    marginLeft: 0
  },
  contentWrapper: {
    width: '100%',
  },
  contentContainer: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  contentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(75, 85, 99, 1)',
    marginBottom: 10,
    textAlign: 'left',
  },
  listContainer: {
    paddingLeft: 2,
    marginBottom: 16,
  },
  listItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary.purple,
    marginTop: 5,
    marginRight: 8,
  },
  listItem: {
    fontSize: 14,
    color: 'rgba(75, 85, 99, 1)',
    lineHeight: 20,
    flex: 1,
  }
});

export default PhotoRecommendations; 