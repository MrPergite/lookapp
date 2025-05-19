import React, { useEffect, useRef } from 'react';
import {
  Animated,
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

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
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-5)).current; // Initial off-screen/hidden position

  useEffect(() => {
    if (startCloseAnimation) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -5,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onCloseAnimationComplete();
      });
    } else if (isVisible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Not visible and not starting close: set to initial hidden state immediately
      opacity.setValue(0);
      translateY.setValue(-5);
    }
  }, [isVisible, startCloseAnimation, opacity, translateY, onCloseAnimationComplete]);

  // The component is rendered by the parent; this component just controls its animated appearance/disappearance.
  // No more `if (!isVisible) return null;` here.

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
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
            <TouchableOpacity
              key={index}
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
          ))
        )}
      </ScrollView>
    </Animated.View>
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
