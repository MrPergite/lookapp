import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  ImageStyle,
  RegisteredStyle,
  Falsy,
  RecursiveArray,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, X as XIcon, Loader2 as Loader } from 'lucide-react-native';
import theme from '@/styles/theme';
import { ThemedText } from '@/components/ThemedText'; // Assuming you have this
import { responsiveFontSize } from '@/utils'; // Assuming this is the correct path
import ConfettiCannonImport from 'react-native-confetti-cannon'; 
const ConfettiCannon = ConfettiCannonImport as any; // Cast the imported component to any

interface CustomAvatarSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  customAvatars: string[];
  onSelectAvatar: (avatarUrl: string) => Promise<void>; // Make it async to handle API call state
  currentPreferredAvatarUrl?: string | null;
  isSubmittingPreference?: boolean;
}

const CustomAvatarSelectionModal: React.FC<CustomAvatarSelectionModalProps> = ({
  visible,
  onClose,
  customAvatars,
  onSelectAvatar,
  currentPreferredAvatarUrl,
  isSubmittingPreference = false,
}) => {
  const [selectedUrlInModal, setSelectedUrlInModal] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiCannonRef = useRef<any>(null); // Ensure ref is typed as any if ConfettiCannon component is cast to any

  useEffect(() => {
    if (visible) {
      // Pre-select based on current preference, or first in list, or null
      setSelectedUrlInModal(
        currentPreferredAvatarUrl || 
        (customAvatars && customAvatars.length > 0 ? customAvatars[0] : null)
      );
      // Trigger confetti when modal becomes visible
      setShowConfetti(true);
    } else {
      setShowConfetti(false); // Reset confetti when modal is not visible
    }
  }, [visible, currentPreferredAvatarUrl, customAvatars]);

  const handleSetAsMyAvatar = async () => {
    console.log('[Modal] Set as My Avatar button pressed. Selected URL:', selectedUrlInModal);
    if (!selectedUrlInModal) {
      console.log('[Modal] No avatar selected in modal, returning.');
      return;
    }
    // Parent handles isSubmitting state via isSubmittingPreference prop for the button
    console.log('[Modal] Calling onSelectAvatar prop...');
    await onSelectAvatar(selectedUrlInModal);
    console.log('[Modal] onSelectAvatar prop finished.');
  };

  const screenWidth = Dimensions.get('window').width;
  const modalOverallWidth = screenWidth * 0.9; 
  const modalInnerPadding = theme.spacing?.lg || 20; // This is the padding of modalViewContainer
  const itemGap = theme.spacing?.sm || 8; // This is the gap between columns, from columnWrapperStyle
  const numColumns = 2;
  
  // Width available for columns, after accounting for modal's own inner padding
  const availableWidthForColumns = modalOverallWidth - (modalInnerPadding * 2);
  
  // Width for each item/column (subtract inter-column gaps, then divide by numColumns)
  const imageWidth = (availableWidthForColumns - (itemGap * (numColumns - 1))) / numColumns;
  const imageHeight = imageWidth * 1.7; 

  const renderAvatarItem = ({ item }: { item: string }) => {
    return (
      <TouchableOpacity
        style={[
          styles.avatarItem,
          { 
            width: imageWidth, 
            height: imageHeight,
          },
          selectedUrlInModal === item && styles.selectedAvatarItem,
        ]}
        onPress={() => setSelectedUrlInModal(item)}
        activeOpacity={0.8}
      >
        <Image source={{ uri: item }} style={styles.avatarImage as ImageStyle} contentFit="cover" />
        {selectedUrlInModal === item && (
          <View style={styles.selectionOverlay as ViewStyle}>
            <View style={styles.checkIconWrapper as ViewStyle}>
              <Check size={Math.max(16, imageWidth * 0.2)} color={theme.colors.primary.purple as string || '#7E22CE'} />
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeAreaModalContainer as ViewStyle}>
        <View style={styles.modalViewContainer as ViewStyle}>
          {showConfetti && (
            <ConfettiCannon
              count={200} // Increased count for better effect from center
              origin={{ x: Dimensions.get('window').width / 2, y: Dimensions.get('window').height / 2 }} // Center of the screen
              autoStart={true}
              autoStartDelay={0} 
              fadeOut={true} 
              explosionSpeed={500} // Slightly increased speed for a burst from center
              fallSpeed={3000}   
              ref={confettiCannonRef as any}
              style={styles.confettiLayer} 
              // Optional: Add specific colors if desired
              // colors={['#A855F7', '#EC4899', '#8B5CF6', '#F472B6']}
              // Optional: Spread them out more
              // spread={360}
              // Optional: Define a radius from the origin they should spread to
              // radius={Dimensions.get('window').width}
            />
          )}
          <LinearGradient 
              colors={['rgba(233, 213, 255, 0.5)', 'rgba(255, 255, 255,1)', 'rgba(251, 222, 238, 0.5)']}
              style={styles.modalGradientBackground as ViewStyle} 
          />
          <View style={styles.modalHeaderContainer as ViewStyle}>
              <ThemedText style={styles.modalTitle as TextStyle}>Your Custom Avatars Are Ready!
              </ThemedText>
              <ThemedText style={styles.modalSubtitle as TextStyle}>Choose your favorite to use when trying on clothes</ThemedText>
              <TouchableOpacity style={styles.closeButton as ViewStyle} onPress={onClose}>
                  <XIcon size={20} color={theme.colors.text as string} />
              </TouchableOpacity>
          </View>

          {customAvatars && customAvatars.length > 0 ? (
              <FlatList
                  data={customAvatars}
                  renderItem={renderAvatarItem}
                  keyExtractor={(item, index) => `modal-avatar-${index}-${item}`}
                  numColumns={numColumns}
                  contentContainerStyle={styles.listContentContainer} // Will remove paddingHorizontal from here
                  showsVerticalScrollIndicator={false}
                  style={{ zIndex: 1}} 
                  columnWrapperStyle={{ 
                      // justifyContent: 'flex-start', // Default is fine, or space-between if you prefer items to spread
                      gap: itemGap,              // Use gap for spacing between columns
                      marginBottom: itemGap,     // Space below each row of items
                  }} 
              />
          ) : (
              <View style={styles.emptyStateContainer as ViewStyle}>
                  <ThemedText style={styles.infoText as TextStyle}>No custom avatars to display.</ThemedText>
                  <ThemedText style={styles.infoTextNote as TextStyle}>Create one from your Style Profile!</ThemedText>
              </View>
          )}

          <View style={styles.modalFooter as ViewStyle}>
              <TouchableOpacity style={styles.footerButtonOutline as ViewStyle} onPress={onClose} disabled={isSubmittingPreference}>
                  <ThemedText style={styles.footerButtonTextOutline as TextStyle}>Skip for now</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                  style={[styles.footerButtonFill, (!selectedUrlInModal || isSubmittingPreference) && styles.disabledButton] as ViewStyle[]}
                  onPress={handleSetAsMyAvatar} 
                  disabled={!selectedUrlInModal || isSubmittingPreference}
              >
                  {isSubmittingPreference ? (
                      <ActivityIndicator size="small" color="#fff" />
                  ) : (
                      <ThemedText style={styles.footerButtonTextFill as TextStyle}>Set as My Avatar</ThemedText>
                  )}
              </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
    safeAreaModalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)', 
    } as ViewStyle,
    modalViewContainer: { 
        width: '95%',
        maxWidth: 400, 
        height: '90%', 
        backgroundColor: 'white', 
        borderRadius: 16, 
        overflow: 'hidden',
        padding:  20, // Use theme spacing directly here
        flexDirection: 'column',
    } as ViewStyle,
    modalGradientBackground: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    } as ViewStyle,
    modalHeaderContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing?.md || 16,
        zIndex: 1,
    } as ViewStyle,
    modalTitle: {
        fontSize: responsiveFontSize(18),
        fontWeight: '600',
        color: theme.colors.primary.purple as string, 
        textAlign: 'center',
        marginBottom: theme.spacing?.xs || 4,
    } as TextStyle,
    modalSubtitle: {
        fontSize: responsiveFontSize(13),
        color: theme.colors.secondary.darkGray as string, 
        textAlign: 'center',
    } as TextStyle,
    closeButton: {
        position: 'absolute',
        top: (theme.spacing?.sm || 8) / 2, // Adjusted to be within padding
        right: (theme.spacing?.sm || 8) / 2,
        padding: theme.spacing?.xs || 4, 
        zIndex: 2,
    } as ViewStyle,
    listContentContainer: {
       padding:10
        // No horizontal padding here; handled by modalViewContainer and item gaps
    } as ViewStyle, 
    avatarItem: {
        width: '100%',
        height: '100%',
        borderRadius: 8, 
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: theme.colors.secondary.lightGray as string,
        backgroundColor: '#eee',
       margin:5
        // width, height are applied dynamically in renderItem
    } as ViewStyle, 
    selectedAvatarItem: {
        borderColor: theme.colors.primary.purple as string, 
        transform: [{ scale: 1.05 }], 
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    } as ViewStyle,
    avatarImage: {
        width: '100%',
        height: '100%',
    } as ImageStyle,
    selectionOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    } as ViewStyle,
    checkIconWrapper: {
        backgroundColor: 'white',
        borderRadius: 999,
        padding: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
    } as ViewStyle,
    emptyStateContainer: {
        flex: 1, 
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
        minHeight: 150, 
        zIndex: 1,
    } as ViewStyle,
    infoText: {
        fontSize: responsiveFontSize(14),
        color: theme.colors.secondary.darkGray as string,
    } as TextStyle,
    infoTextNote: {
        fontSize: responsiveFontSize(12),
        color: theme.colors.secondary.darkGray as string,
        marginTop: theme.spacing?.xs || 4,
    } as TextStyle,
    modalFooter: {
        flexDirection: 'row',
        marginTop: theme.spacing?.md || 16,
        paddingTop: theme.spacing?.md || 16,
        borderTopWidth: 1,
        borderColor: theme.colors.secondary.lightGray as string,
        gap: theme.spacing?.sm || 8,
        zIndex: 1,
    } as ViewStyle,
    footerButtonOutline: {
        flex: 1,
        paddingVertical: (theme.spacing?.sm || 8) + 4, 
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.secondary.mediumLightGray as string,
        alignItems: 'center',
    } as ViewStyle,
    footerButtonTextOutline: {
        color: theme.colors.text as string,
        fontWeight: '500',
        fontSize: responsiveFontSize(14),
    } as TextStyle,
    footerButtonFill: {
        flex: 1,
        paddingVertical: (theme.spacing?.sm || 8) + 4, 
        borderRadius: 8,
        backgroundColor: theme.colors.primary.purple as string,
        alignItems: 'center',
    } as ViewStyle,
    footerButtonTextFill: {
        color: 'white',
        fontWeight: '500',
        fontSize: responsiveFontSize(14),
    } as TextStyle,
    disabledButton: {
        opacity: 0.6,
    } as ViewStyle,
    confettiLayer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0, // Behind other content that needs interaction (or higher if it should be on top of everything)
        pointerEvents: 'none', // Make sure it doesn't block touches
    },
});

export default CustomAvatarSelectionModal; 