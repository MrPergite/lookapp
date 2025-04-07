import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
  Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  SlideInRight,
  SlideOutRight,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing
} from 'react-native-reanimated';
import theme from '@/styles/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { ProductDetails } from '@/app/(home)/chat-products/types';
import { Product } from '@/app/(home)/chat-products/context';
import { AlertTriangle, Bookmark, Check, ChevronLeft, ChevronRight, CircleX, ExternalLink, LoaderCircle, X } from 'lucide-react-native';
import { useGetProductDetails } from '@/app/(home)/chat-products/queries/get-product-details';
import { useAuth } from '@clerk/clerk-expo';
import AuthModal from './AuthModal';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ProductDetailsProps {
  isVisible: boolean;
  onClose: () => void;
  fetchProduct: Product;
  onBuyNow?: () => void;
  onAddToShoppingList?: () => void;
  isSaved?: boolean;
  isPending?: boolean;
}

const ProductDetailsModal: React.FC<ProductDetailsProps> = ({
  isVisible,
  onClose,
  onBuyNow,
  onAddToShoppingList,
  fetchProduct,
  isSaved,
  isPending,
  
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const opacity = useSharedValue(0);
  const { isLoading, isError, getProductDetailsFromId, closeProductDetails, productDetails: product } = useGetProductDetails();
  const { isSignedIn } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  console.log("inside product details modal", product);

  // Handle background fade animation
  React.useEffect(() => {
    if (isVisible) {
      getProductDetailsFromId(fetchProduct);
      opacity.value = withTiming(1, { duration: 300, easing: Easing.ease });
    } else {
      opacity.value = withTiming(0, { duration: 300, easing: Easing.ease });
    }
  }, [isVisible]);

  const backgroundStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  if (!isVisible) return null;

  const handlePrevImage = () => {
    if (product?.img_urls_list && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleNextImage = () => {
    if (product?.img_urls_list && currentImageIndex < product.img_urls_list.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handleBuyNow = () => {
    if (onBuyNow) {
      onBuyNow();
    } else if (product?.product_link) {
      Linking.openURL(product.product_link).catch((err) =>
        console.error('Error opening product link:', err));
    }
  };

  const handleAddToShoppingList = () => {
    console.log("handleAddToShoppingList", isSignedIn);
    if (!isSignedIn) {
      setShowLoginModal(true);
      return;
    }
    if (onAddToShoppingList) {
      onAddToShoppingList();
    }
  };

  const renderDots = () => {
    if (!product?.img_urls_list) return null;

    return (
      <View style={styles.dotsContainer}>
        {product.img_urls_list.map((_, index) => (
          <View
            key={`dot-${index}`}
            style={[
              styles.dot,
              index === currentImageIndex ? styles.activeDot : null
            ]}
          />
        ))}
      </View>
    );
  };

  // Loading State Content
  const renderLoadingContent = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary.purple} />
      <Text style={styles.loadingText}>Loading product details...</Text>
    </View>
  );

  const shoppingListButton = () => (
    !isSaved ? (
      <Pressable
        disabled={isPending}
        style={[styles.buyButton, styles.addToShoppingListButton]}
        onPress={handleAddToShoppingList}
      >
        <Bookmark size={18} color="black" style={styles.buttonIcon} />
        <Text style={[styles.buyButtonText, { color: theme.colors.secondary.black }]}>{isPending ? "Adding..." : "Add to shopping list"}</Text>
      </Pressable>
    ) :
      <View style={[styles.buyButton, styles.addToShoppingListButton, { backgroundColor: theme.colors.primary.bgGreen }]}>
        <Check size={18} color={theme.colors.primary.green} style={styles.buttonIcon} />
        <Text style={[styles.buyButtonText, { color: theme.colors.primary.green }]}>Added to shopping list</Text>
      </View>
  )

  // Error State Content
  const renderErrorContent = () => (
    <View style={styles.errorContainer}>
      <AlertTriangle size={70} color="#e74c3c" style={styles.errorIcon} />
      <Text style={styles.errorTitle}>Unable to load product details</Text>
      <Text style={styles.errorMessage}>
        We couldn't retrieve the detailed information for this product. You can
        still view the image and visit the product page.
      </Text>

      <TouchableOpacity
        style={styles.visitProductButton}
        onPress={() => {
          console.log("product link -->", fetchProduct);
          if (fetchProduct.url) {
            Linking.openURL(fetchProduct.url).catch((err) =>
              console.error('Error opening product link:', err));
          }
        }}
      >
        <Text style={styles.visitProductButtonText}>Visit Product Page</Text>
        <ExternalLink size={18} color="white" />
      </TouchableOpacity>

      {shoppingListButton()}
    </View>
  );



  return (
    <Modal style={styles.modalContainer}>
      {/* Animated background */}
      <Animated.View
        style={[styles.backgroundOverlay, backgroundStyle]}
      />

      {/* Modal content */}
      <Animated.View
        entering={SlideInRight.duration(300).easing(Easing.ease)}
        exiting={SlideOutRight.duration(300).easing(Easing.ease)}
        style={[styles.modalContent, { paddingBottom: insets.bottom || 20 }]}
      >
        {/* Close button - always visible */}
        <TouchableOpacity
          style={[styles.closeButton, isLoading || isError ? styles.closeButtonAlt : null]}
          onPress={onClose}
        >
          <BlurView intensity={30} style={styles.closeBlur}>
            <X size={24} color={isLoading || isError ? "black" : "white"} />
          </BlurView>
        </TouchableOpacity>

        {isLoading ? (
          renderLoadingContent()
        ) : isError ? (
          renderErrorContent()
        ) : (
          // Normal product display
          <>
            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.scrollViewContent}
              showsVerticalScrollIndicator={true}
              bounces={true}
              nestedScrollEnabled={true}
            >
              {/* Image Carousel Section */}
              <View style={styles.carouselContainer}>
                <Image
                  source={{ uri: product?.img_urls_list?.[currentImageIndex] || '' }}
                  style={styles.productImage}
                  resizeMode="cover"
                />

                {/* Navigation arrows if there are multiple images */}
                {product?.img_urls_list && product.img_urls_list.length > 1 && (
                  <>
                    <TouchableOpacity
                      style={[styles.navArrow, styles.leftArrow]}
                      onPress={handlePrevImage}
                      disabled={currentImageIndex === 0}
                    >
                      <BlurView intensity={30} style={styles.arrowBlur}>
                        <ChevronLeft
                          size={24}
                          color="white"
                          style={{ opacity: currentImageIndex === 0 ? 0.5 : 1 }}
                        />
                      </BlurView>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.navArrow, styles.rightArrow]}
                      onPress={handleNextImage}
                      disabled={currentImageIndex === product.img_urls_list.length - 1}
                    >
                      <BlurView intensity={30} style={styles.arrowBlur}>
                        <ChevronRight
                          size={24}
                          color="white"
                          style={{ opacity: currentImageIndex === product.img_urls_list.length - 1 ? 0.5 : 1 }}
                        />
                      </BlurView>
                    </TouchableOpacity>
                  </>
                )}

                {/* Indicator dots */}
                {renderDots()}

                {/* Color selector */}
                {/* <View style={styles.colorSelector}>
                  <View style={[styles.colorOption, styles.selectedColor]}>
                    <View style={[styles.colorCircle, { backgroundColor: 'black' }]} />
                  </View>
                </View> */}
              </View>

              {/* Product Info Section */}
              <View style={styles.infoContainer}>
                {/* Brand */}
                <Text style={styles.brandText}>{product?.brand || ''}</Text>

                {/* Product Name */}
                <Text style={styles.productName}>{product?.name || ''}</Text>

                {/* Price */}
                <Text style={styles.priceText}>{product?.price || ''}</Text>

                {/* Section Title */}
                <Text style={styles.sectionTitle}>Details</Text>

                {/* Product Description */}
                <Text style={styles.descriptionText}>
                  {product?.description || 'No product details available.'}
                </Text>

                {/* Add extra padding for button */}
                <View style={styles.buttonSpacer} />
              </View>
              {showLoginModal && (
              <AuthModal
                isVisible={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onSignIn={() => {
                  setShowLoginModal(false);
                  router.push("/(authn)/signin");
                }}
                onSignUp={() => {
                  setShowLoginModal(false);
                  router.push("/(authn)/signup");
                }}
              />
            )}
            </ScrollView>

            {/* Buy Now Button - Fixed at the bottom */}
            <View style={styles.buyButtonContainer}>
              <Pressable
                style={styles.buyButton}
                onPress={handleBuyNow}
              >
                <Text style={styles.buyButtonText}>Buy Now</Text>
                <ExternalLink size={18} color="white" style={styles.buttonIcon} />
              </Pressable>
              {
                shoppingListButton()
              }
            </View>
          </>
        )}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    backgroundColor: theme.colors.primary.white,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    overflow: 'hidden',
  },
  carouselContainer: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.6,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  navArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  leftArrow: {
    left: theme.spacing.md,
  },
  rightArrow: {
    right: theme.spacing.md,
  },
  arrowBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: theme.spacing.md,
    zIndex: 10,
  },
  closeButtonAlt: {
    // For error and loading states
    top: 20,
  },
  closeBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: theme.colors.primary.white,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  colorSelector: {
    position: 'absolute',
    top: theme.spacing.lg + 40,
    left: theme.spacing.md,
    zIndex: 5,
  },
  colorOption: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  selectedColor: {
    borderColor: theme.colors.primary.white,
    borderWidth: 2,
  },
  colorCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  infoContainer: {
    padding: theme.spacing.lg,
    paddingBottom: 100, // Increased padding to ensure description is fully visible
  },
  brandText: {
    fontSize: 14,
    color: theme.colors.secondary.darkGray,
    marginBottom: 4,
    fontFamily: 'default-medium',
    textTransform: 'uppercase',
  },
  productName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.secondary.black,
    fontFamily: 'default-bold',
  },
  priceText: {
    fontSize: 22,
    color: theme.colors.secondary.black,
    marginBottom: theme.spacing.lg,
    fontFamily: 'default-medium',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
    color: theme.colors.secondary.black,
    fontFamily: 'default-semibold',
  },
  descriptionText: {
    fontSize: 16,
    color: theme.colors.secondary.darkGray,
    lineHeight: 24,
    fontFamily: 'default-regular',
  },
  buyButton: {
    backgroundColor: theme.colors.primary.purple,
    borderRadius: 8,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary.white,
    fontFamily: 'default-semibold',
  },
  buttonIcon: {
    marginRight: 8,
  },
  modalScrollView: {
    flex: 1,
    width: '100%',
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  buttonSpacer: {
    height: 70, // Extra space at the bottom
  },
  buyButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.primary.white,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.secondary.lightGray,
    elevation: 5, // Add elevation for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    gap: theme.spacing.md,
  },
  addToShoppingListButton: {
    backgroundColor: theme.colors.primary.white,
    borderWidth: 1,
    borderColor: theme.colors.secondary.lightGray,
    color: theme.colors.secondary.black,
  },
  // Loading state styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.secondary.darkGray,
    fontFamily: 'default-medium',
  },
  // Error state styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  errorIcon: {
    marginBottom: theme.spacing.md,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.secondary.black,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    fontFamily: 'default-bold',
  },
  errorMessage: {
    fontSize: 16,
    color: theme.colors.secondary.darkGray,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
    paddingHorizontal: theme.spacing.md,
    fontFamily: 'default-regular',
  },
  visitProductButton: {
    backgroundColor: '#8C52FF', // Use the purple color from image
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    marginBottom: theme.spacing.md,
    gap: 8,
  },
  visitProductButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'default-semibold',
  },
  addToShoppingListErrorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.secondary.lightGray,
    backgroundColor: 'white',
    gap: 8,
  },
  addToShoppingListErrorText: {
    color: theme.colors.secondary.black,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'default-semibold',
  },
});

export default ProductDetailsModal; 