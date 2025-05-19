import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Pressable,
  Dimensions,
} from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { BlurView } from '@react-native-community/blur';
import {OutfitDialog} from './outfit-dialog';
import { useSaveShoppingList } from '../queries/save-shopping-list';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OutfitCardProps {
  darkMode: boolean;
  comingSoon?: boolean;
  resultImage?: string;
  isMobile?: boolean;
  videoUrl?: string;
  outfitItems?: any[];
  outfitName?: string;
  outfitPrice?: string;
}

const OutfitCard: React.FC<OutfitCardProps> = ({
  darkMode,
  comingSoon,
  resultImage,
  isMobile,
  videoUrl,
  outfitItems = [],
  outfitName = 'Casual Outfit',
  outfitPrice,
}) => {
  const videoRef = useRef<VideoRef>(null);
  const isVideo = !!videoUrl;
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { savedProducts, savingProducts, saveSuccess, saveError, saveShoppingItem, isPending } = useSaveShoppingList(() => setShowLoginModal(true))

  const handleError = () => {
    setHasError(true);
    setMediaLoaded(true);
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        darkMode ? styles.darkBg : styles.lightBg,
        isMobile ? styles.shadow : styles.shadowLg,
        { transform: [{ scale: pressed ? (isMobile ? 1 : 1.02) : 1 }] },
      ]}
      onPress={() => {}}
      android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
    >
      {/* Media container */}
      <View style={styles.mediaContainer}>
        {isVideo ? (
          <>
            {/* Video badge */}
            <View style={styles.badge}>
              <Feather name="video" size={14} color="#FFF" />
              <Text style={styles.badgeText}>Video</Text>
            </View>

            {/* Loading */}
            {!mediaLoaded && !hasError && (
              <View style={[styles.overlay, styles.loadingBg]}>
                <ActivityIndicator size="large" color="#E5E7EB" />
              </View>
            )}

            {/* Error */}
            {hasError && (
              <View style={[styles.overlay, styles.errorBg]}>
                <Text style={styles.errorText}>Media unavailable</Text>
              </View>
            )}

            {/* Video player */}
            {!hasError && (
              <Video
                ref={videoRef}
                source={{ uri: videoUrl! }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
                muted
                repeat
                onLoad={() => setMediaLoaded(true)}
                onError={handleError}
              />
            )}
          </>
        ) : (
          <>
            {/* Loading */}
            {!mediaLoaded && !hasError && (
              <View style={[styles.overlay, styles.loadingBg]}>
                <ActivityIndicator size="large" color="#E5E7EB" />
              </View>
            )}

            {/* Error */}
            {hasError && (
              <View style={[styles.overlay, styles.errorBg]}>
                <Text style={styles.errorText}>Image unavailable</Text>
              </View>
            )}

            {/* Image */}
            {!hasError && resultImage ? (
              <Image
                source={{ uri: resultImage }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                onLoad={() => setMediaLoaded(true)}
                onError={handleError}
              />
            ) : (
              <View style={[styles.placeholder]} />
            )}
          </>
        )}

        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Coming soon overlay */}
        {/* {comingSoon && (
          <BlurView
            style={styles.overlay}
            blurType={darkMode ? 'dark' : 'light'}
            blurAmount={10}
          >
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </BlurView>
        )} */}

        {/* Outfit name footer */}
        {!comingSoon && mediaLoaded && outfitItems.length > 0 && (
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'transparent']}
            style={styles.footer}
          >
            <Text style={styles.outfitName}>{outfitName}</Text>
            {outfitPrice && <Text style={styles.outfitPrice}>{outfitPrice}</Text>}
          </LinearGradient>
        )}
      </View>

      {/* Details & button */}
      {!comingSoon && mediaLoaded && (
        <View style={[styles.details, darkMode ? styles.darkBg : styles.lightBg]}>
          {outfitItems.length > 0 && (
            <Pressable
              onPress={() => setDialogOpen(true)}
              style={({ pressed }) => [
                styles.fullBtn,
                { transform: [{ scale: pressed ? 0.95 : 1 }] },
              ]}
            >
              <LinearGradient
                colors={['#9333EA', '#E879F9', '#60A5FA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 999 }]}
              />
              <View style={styles.fullContent}>
                <Feather name="eye" size={16} color="#FFF" />
                <Text style={styles.fullText}>See Full Outfit</Text>
              </View>
            </Pressable>
          )}
        </View>
      )}

      {/* Dialog */}
      <OutfitDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        outfitImage={resultImage}
        outfitName={outfitName}
        items={outfitItems}
        saveShoppingItemConfig={{
          savedProducts,
          savingProducts,
          saveSuccess,
          saveError,
          saveShoppingItem,
          isPending
        }}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 10,
  },
  darkBg: { backgroundColor: '#1F2937' }, // gray-800
  lightBg: { backgroundColor: '#FFFFFF' },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  shadowLg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 5,
  },
  mediaContainer: {
    width: '100%',
    aspectRatio: 3 / 5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    zIndex: 1,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    marginLeft: 4,
    fontWeight: '600',
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingBg: { backgroundColor: 'rgba(229,231,235,0.5)' },
  errorBg: { backgroundColor: '#F3F4F6' },
  errorText: { color: '#6B7280', fontSize: 14 },
  placeholder: { flex: 1, backgroundColor: 'rgba(167,139,250,0.2)' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    alignItems: 'center',
  },
  outfitName: { color: '#FFF', fontSize: 16, fontWeight: '500', textAlign: 'center' },
  outfitPrice: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 4 },
  details: { padding: 16 },
  fullBtn: {
    borderRadius: 999,
    overflow: 'hidden',
    position: 'relative',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullContent: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
    padding:12
  },
  fullText: { color: '#FFF', fontSize: 14, marginLeft: 8, fontWeight: '600' },
});
export default OutfitCard;

