import React, { useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';

interface SuggestedSearchesProps {
  isVisible: boolean; // True when the parent wants it to be shown and animating in
  startCloseAnimation: boolean; // True when parent wants it to animate out
  onCloseAnimationComplete: () => void; // Callback when close animation is done
  onSelect: (s: string) => void;
  inputRef: React.RefObject<any>;
  suggestions: string[];
  hasFetchedUrl: boolean;
}

export const SuggestedSearches: React.FC<SuggestedSearchesProps> = ({
  isVisible,
  startCloseAnimation,
  onCloseAnimationComplete,
  onSelect,
  suggestions,
  hasFetchedUrl,
}) => {
  useEffect(() => {
    if (startCloseAnimation || !isVisible) {
      onCloseAnimationComplete();
    }
  }, [isVisible, startCloseAnimation, onCloseAnimationComplete]);

  return (
    <View
      style={styles.container}
    >
      {/* White background overlay */}
      <View style={styles.backgroundOverlay} />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        { !hasFetchedUrl && (
          <Text style={styles.headerText}>
            {suggestions.length > 0
              ? 'Suggested searches'
              : 'No suggested searches found'}
          </Text>
        )}

        {/* Loading state */}
        {hasFetchedUrl ? (
          <View style={styles.fetchingContainer}>
            <ActivityIndicator size="small" color="#7C3AED" />
            <Text style={styles.fetchingText}>
              fetching suggested searches...
            </Text>
          </View>
        ) : (
          suggestions.map((suggestion, index) => (
            <Animated.View
              key={suggestion}
              entering={FadeInRight.delay(index * 50).duration(200)}
              exiting={FadeOutLeft.duration(150)}
            >
              <TouchableOpacity
                style={styles.suggestionButton}
                activeOpacity={0.7}
                onPress={() => onSelect(suggestion)}
              >
                <Feather
                  name="search"
                  size={16}
                  color="#9CA3AF"
                  style={styles.icon}
                />
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 9999999, // Keep high zIndex for overlaying within its own context
    width: '100%',
    marginTop: 0,
    borderRadius: 12,
    maxHeight: 245,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    zIndex: -1,
  },
  scrollContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(229,231,235,1)',
    borderRadius: 12,
  },
  contentContainer: {
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  fetchingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  fetchingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4B5563',
  },
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginBottom: 4,
  },
  icon: {
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    textAlign: 'left',
  },
});
