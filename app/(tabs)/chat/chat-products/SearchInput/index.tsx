// SearchInput.tsx

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Instagram } from 'lucide-react-native';
import { useSearchInput } from './useSearchInput';
import TextArea from './TextArea';
// import ImageUploadDialog from '../ImageUploadDialog';
// import ShoppingListPopup from '../ShoppingListPopup';
import { SuggestedSearches } from './SuggestedSearches';
import { AboutEcoAIDialog } from './AboutEcoDialog';
import { GenderSelector } from './GenderSelect';
import { useImageContext } from '../../../../../common/providers/image-search';
import { useAuth } from '@clerk/clerk-react';
import theme from '@/styles/theme';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SearchInputProps {
  darkMode: boolean;
  inputMode: 'text' | 'url' | 'social';
  // setInputMode: (mode: 'text' | 'url' | 'social') => void;
  inputValue: string;
  setInputValue: (text: string) => void;
  onSearch: () => void;
  promptChips: string[];
  hasFetchedUrl: boolean;
  setSearchText: (text: string) => void;
  handleInstagramClick: () => void;
}

export default function SearchInput({
  darkMode = true,
  inputMode = 'text',
  inputValue = '',
  setInputValue = () => { },
  onSearch = () => { },
  promptChips = [],
  hasFetchedUrl = false,
  setSearchText = () => { },
  handleInstagramClick = () => { },
}: SearchInputProps) {
  const {
    textareaRef,
    // isUploadDialogOpen,
    // setIsUploadDialogOpen,
    // isWardrobeOpen,
    setIsWardrobeOpen,
    isFocused,
    showSuggestions: showSuggestionsFromHook,
    setShowSuggestions: setShowSuggestionsInHook,
    handleInputChange,
    handleSearch,
    handleKeyDown,
    handleFocus,
    handleBlur,
    // uploadType,
    // setUploadType,
  } = useSearchInput({
    inputValue: inputValue,
    setInputValue: setInputValue,
    setSearchText: setSearchText,
  });

  const { selectedGender, setSelectedGender } = useImageContext();
  const [cardHeight, setCardHeight] = useState(0);
  const { isSignedIn } = useAuth();

  // New states for managing SuggestedSearches lifecycle
  const [renderSuggestions, setRenderSuggestions] = useState(false);
  const [animateSuggestionsClose, setAnimateSuggestionsClose] = useState(false);

  const lastScrollY = useRef(0);
  const scrollThreshold = 50;

  useEffect(() => {
    if (showSuggestionsFromHook) {
      if (!renderSuggestions) { // If hook wants to show, and we are not rendering/animating close
        setRenderSuggestions(true);
        setAnimateSuggestionsClose(false); // Ensure appear animation is triggered
      }
    } else { // Hook wants to hide
      if (renderSuggestions && !animateSuggestionsClose) { // If we are rendering and not already closing
        setAnimateSuggestionsClose(true); // Trigger close animation
      }
    }
  }, [showSuggestionsFromHook, renderSuggestions, animateSuggestionsClose]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = e.nativeEvent.contentOffset.y;
    const diff = Math.abs(currentY - lastScrollY.current);
    if (diff > scrollThreshold && renderSuggestions && !animateSuggestionsClose) {
      //setShowSuggestionsInHook(false); // This would trigger the useEffect above to start close animation
      setAnimateSuggestionsClose(true); // More direct way to close on scroll
    }
    lastScrollY.current = currentY;
  };

  const getPlaceholderText = () => {
    if (renderSuggestions) return '';
    if (inputValue) return '';
    switch (inputMode) {
      case 'text':
        return 'Search for any fashion item...';
      case 'url':
        return 'Paste Instagram URL...';
      case 'social':
        return 'Paste Instagram post URL...';
      default:
        return 'Type to search...';
    }
  };

  // const handleInstagramClick = () => {
  //   setUploadType('social');
  //   setIsUploadDialogOpen(true);
  // };

  // Assuming styles.container.padding is a number (e.g., 16)
  // Or define separate vertical/horizontal paddings if styles.container.padding is an object
  const containerPadding = styles.container.padding || 0;
  const cardPadding = styles.card.padding || 0;

  const handleSuggestionSelected = (s: string) => {
    setSearchText(s);
    setInputValue(s);
    setAnimateSuggestionsClose(true); // Start close animation
    // setShowSuggestionsInHook(false); // Let animation handler do this
  };

  const handleCloseAnimationComplete = () => {
    setRenderSuggestions(false);
    setAnimateSuggestionsClose(false);
    setShowSuggestionsInHook(false); // Sync with the hook state
  };

  return (
    <SafeAreaView style={styles.safeArea}>

      <ScrollView
        style={[styles.scrollViewStyle, { zIndex: 1 }]}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={16}
        
      >
        <View
          style={[styles.card, darkMode && styles.cardDark]}
          onLayout={(event) => {
            setCardHeight(event.nativeEvent.layout.height);
          }}
        >
          <TextArea
            darkMode={darkMode}
            inputValue={inputValue}
            textareaRef={textareaRef}
            handleInputChange={handleInputChange}
            handleKeyDown={handleKeyDown}
            handleFocus={handleFocus}
            handleBlur={handleBlur}
            handleSearch={onSearch}
            inputMode={inputMode}
            getPlaceholderText={getPlaceholderText}
            uploadedImage={null}
            isSecondHand={false}
          />

          <View style={styles.controlsRow}>
          {/* <Instagram onPress={handleInstagramClick} size={24} color={theme.colors.primary.purple} /> */}


            <View style={styles.centerControl}>
              {!isSignedIn && (
                <GenderSelector
                  selectedGender={selectedGender}
                  setSelectedGender={setSelectedGender}
                  darkMode={true}
                />
              )}
            </View>

            <TouchableOpacity onPress={() => setIsWardrobeOpen(true)}>
              {/* <AboutEcoAIDialog darkMode={darkMode} /> */}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {renderSuggestions && (
        <View
          style={[
            styles.suggestionsWrapper,
            {
              top: cardHeight + containerPadding + 8,
              left: containerPadding,
              right: containerPadding,
              zIndex: 9999
            }
          ]}>
          <SuggestedSearches
            isVisible={renderSuggestions && !animateSuggestionsClose}
            startCloseAnimation={animateSuggestionsClose}
            onCloseAnimationComplete={handleCloseAnimationComplete}
            suggestions={promptChips}
            hasFetchedUrl={hasFetchedUrl}
            onSelect={handleSuggestionSelected}
            inputRef={textareaRef}
          />
        </View>

      )
      }

      {/* <Modal
            visible={isUploadDialogOpen}
            transparent
            animationType="slide"
            onRequestClose={() => setIsUploadDialogOpen(false)}
          >
            <ImageUploadDialog
              isOpen={isUploadDialogOpen}
              onClose={() => setIsUploadDialogOpen(false)}
              defaultTab={uploadType}
            />
          </Modal> */}

      {/* <Modal
            visible={isWardrobeOpen}
            transparent
            animationType="slide"
            onRequestClose={() => setIsWardrobeOpen(false)}
          >
            <ShoppingListPopup
              isOpen={isWardrobeOpen}
              onClose={() => setIsWardrobeOpen(false)}
              onItemSelect={(item) => {
                setInputValue(\`Find items that match with \${item.title}\`);
                setIsWardrobeOpen(false);
              }}
            />
          </Modal> */}
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  safeArea: { },
  scrollViewStyle: { // Added for clarity, was styles.flex before
  },
  container: { // This is contentContainerStyle for ScrollView
    alignItems: 'center',
    padding: 16, // General padding for the scrollable content area
  },
  card: {
    width: SCREEN_WIDTH - 32, // Card width considering container's padding (16 on each side)
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12, // Internal padding of the card
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4, // Keep card elevation
  },
  cardDark: {
    backgroundColor: '#fff',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5, // Keep card dark elevation
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  iconButton: {
    padding: 0, // Adjusted if gradient has padding
    // borderRadius: 100, // May not be needed directly on TouchableOpacity if gradient provides shape
    // fontSize: 16, marginBottom:0 // Not applicable here
  },
  centerControl: {
    flex: 1,
    alignItems: 'center',
  },
  instagramIconGradient: {
    padding: 8, // Padding for the gradient background around the icon
    borderRadius: 100, // Circular background
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsWrapper: {
    position: 'absolute', // Positioned relative to KeyboardAvoidingView
    // Width is implicitly set by left/right and parent width.
    // Ensure it doesn't exceed screen bounds if KeyboardAvoidingView is not full width.
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 10, // Give suggestions wrapper its own elevation, higher than card
    // This is important if it needs to overlay the card itself in some scenarios
    // And crucial for Android stacking.
  },
});
