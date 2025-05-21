import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Image,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trash, ShoppingCart, ChevronDown, Bell, BarChart3, Tag, MessageSquare, Loader } from 'lucide-react-native';
import Collapsible from 'react-native-collapsible';
// import ComingSoonOverlay from './ComingSoonOverlay';
import FeatureDescriptionPopup from './FeatureDescriptionPopup';
import ProductDetails from './ProductDetails';
import ImageSlider from './ImageSlider';
// import ProductRating if needed
// import ProductRating from '../../HomeSearch/components/SearchResults/ProductCard/components/ProductRating';
import { Feather } from '@expo/vector-icons';

export default function ListItem({ item, onRemove, isDeleting, index = 0 }: { item: any, onRemove: (itemId: string, productLink: string) => void, isDeleting: boolean, index?: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);

  // Add animation values
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  // Add animated height and rotation for a smoother transition
  const [contentHeight, setContentHeight] = useState(0);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;

  // Add animation values for delete button transition
  const deleteButtonScale = useRef(new Animated.Value(1)).current;
  const deleteIconOpacity = useRef(new Animated.Value(1)).current;
  const loaderOpacity = useRef(new Animated.Value(0)).current;
  const deleteButtonRotation = useRef(new Animated.Value(0)).current;
  // Convert rotation value to interpolated rotation string
  const rotate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // Convert rotation value to interpolated rotation string
  const deleteRotation = deleteButtonRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Add local loading state that immediately reflects the isDeleting prop
  const [localIsDeleting, setLocalIsDeleting] = useState(isDeleting);
  
  // Update local state when prop changes
  useEffect(() => {
    setLocalIsDeleting(isDeleting);
  }, [isDeleting]);

  // Setup animation effect
  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 100), // Staggered delay based on item index
      Animated.parallel([
        Animated.timing(opacity, { 
          toValue: 1, 
          duration: 300, 
          useNativeDriver: true 
        }),
        Animated.timing(translateY, { 
          toValue: 0, 
          duration: 300, 
          useNativeDriver: true 
        }),
      ]),
    ]).start();
  }, [index, opacity, translateY]);

  // Update animations when expansion state changes
  useEffect(() => {
    // Animate content height
    Animated.timing(animatedHeight, {
      toValue: isExpanded ? contentHeight : 0,
      duration: 300,
      useNativeDriver: false, // Height animations can't use native driver
    }).start();
    
    // Animate chevron rotation
    Animated.timing(rotateAnimation, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isExpanded, contentHeight]);

  // Update animation when isDeleting changes
  useEffect(() => {
    if (isDeleting) {
      // When starting to delete, animate transition to loader
      Animated.parallel([
        Animated.timing(deleteIconOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(loaderOpacity, {
          toValue: 1, 
          duration: 200,
          useNativeDriver: true
        }),
        Animated.sequence([
          // Quick pulse animation
          Animated.timing(deleteButtonScale, {
            toValue: 0.9,
            duration: 150,
            useNativeDriver: true
          }),
          Animated.spring(deleteButtonScale, {
            toValue: 1,
            friction: 4,
            tension: 40,
            useNativeDriver: true
          })
        ]),
        // Add slight rotation for more visual feedback
        Animated.timing(deleteButtonRotation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    } else {
      // When finished deleting, animate back to normal
      Animated.parallel([
        Animated.timing(deleteIconOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(loaderOpacity, {
          toValue: 0,
          duration: 200, 
          useNativeDriver: true
        }),
        Animated.spring(deleteButtonScale, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true
        }),
        Animated.timing(deleteButtonRotation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [isDeleting]);

  const handleBuyNow = () => {
    if (item.product_link) Linking.openURL(item.product_link);
  };

  const renderPrice = () => {
    if (item.old_price) {
      const original = parseFloat(item.old_price.replace(/[^0-9.]/g, ''));
      const discounted = parseFloat(item.product_price.replace(/[^0-9.]/g, ''));
      const percent = Math.round(((original - discounted) / original) * 100);
      return (
        <View style={styles.priceContainer}>
          <View style={styles.priceRow}>
            {item.product_price && (
              <Text style={styles.currentPrice}>{item.product_price}</Text>
            )}
            <Text style={styles.oldPrice}>{item.old_price}</Text>
          </View>
          <Text style={styles.discountBadge}>{percent}% OFF</Text>
        </View>
      );
    }
    return item.product_price ? (
      <Text style={styles.currentPrice}>{item.product_price}</Text>
    ) : null;
  };

  const featureTitles = {
    priceAlert: 'Set Price Alert',
    priceHistory: 'See Price History',
    findDeals: 'Find Discount Codes',
    reviews: 'Summarize Reviews',
  };
  const featureIcons = { Bell, BarChart3, Tag, MessageSquare };

  // Modify the onPress handler to toggle expansion
  const toggleExpand = () => {
    setIsExpanded(prev => !prev);
  };

  const handlePressIn = (animationValue: Animated.Value) => {
    Animated.spring(animationValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (animationValue: Animated.Value) => {
    Animated.spring(animationValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const scale = useRef(new Animated.Value(1)).current;

  // Add bounce animation for icons
  const bounceAnimation = (animationValue: Animated.Value) => {
    Animated.sequence([
      Animated.timing(animationValue, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Apply bounce animation to icons
  const iconScale = useRef(new Animated.Value(1)).current;

  // Enhance shadows for a more tactile feel
  const enhancedShadow = {
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  };

  // Animated gradient for buttons
  const animatedGradient = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(animatedGradient, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      })
    ).start();
  }, [animatedGradient]);

  // Correct gradient animation
  const gradientColors = animatedGradient.interpolate({
    inputRange: [0, 1],
    outputRange: ['#8B5CF6', '#3B82F6'],
  });

  const gradientColorsEnd = animatedGradient.interpolate({
    inputRange: [0, 1],
    outputRange: ['#EC4899', '#8B5CF6'],
  });

  // Smooth text transitions
  const [price, setPrice] = useState(item.product_price);
  useEffect(() => {
    const timeout = setTimeout(() => setPrice(item.product_price), 300);
    return () => clearTimeout(timeout);
  }, [item.product_price]);

  // Use static gradient colors with explicit type
  const staticGradientColors: [string, string, string] = ['#8B5CF6', '#EC4899', '#3B82F6'];

  // Scale animation for buttons
  const handleButtonPressIn = (animationValue: Animated.Value) => {
    Animated.spring(animationValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPressOut = (animationValue: Animated.Value) => {
    Animated.spring(animationValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const buttonScale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { opacity, transform: [{ translateY }, { scale }] },
        enhancedShadow
      ]}
    >
      <View style={styles.card}>
        <TouchableOpacity
          style={[
            styles.deleteButton, 
            localIsDeleting && styles.deletingButton
          ]}
          disabled={localIsDeleting}
          onPress={() => {
            // Immediately set local loading state to true for faster feedback
            setLocalIsDeleting(true);
            // Then call the parent's onRemove
            onRemove(item.id, item.product_link);
          }}
        >
          {localIsDeleting ? (
            // Use a larger, more obvious loader with better contrast
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color="#dc2626" />
            </View>
          ) : (
            // Show the trash icon when not deleting
            <Trash size={20} color="#dc2626" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => {
            toggleExpand();
            bounceAnimation(iconScale);
          }}
          onPressIn={() => handleButtonPressIn(buttonScale)}
          onPressOut={() => handleButtonPressOut(buttonScale)}
        >
          <LinearGradient
            colors={staticGradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.iconGradient}
          >
            <Animated.View style={{ transform: [{ scale: iconScale }] }}>
              <Feather name="eye" size={16} color="#FFF" />
            </Animated.View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.imageWrapper}>
          <ImageSlider
            images={item.img_urls_list || [item.img_url]}
            productTitle={item.title}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageOverlay}
          />
          <View style={styles.infoOverlay}>
            {item.brand && !['Unknown', 'nil'].includes(item.brand) && (
              <Text style={styles.brandText}>{item.brand}</Text>
            )}
            <Text style={styles.titleText} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.currentPrice}>{price}</Text>
          </View>
          <View style={styles.paginationDots}>
            {/* Pagination dots can be added here */}
          </View>
        </View>

        <View style={styles.actionsRow}>
          <LinearGradient
             colors={staticGradientColors}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.buyContainer}
          >
            <TouchableOpacity 
              style={styles.buyBtn} 
              onPress={handleBuyNow}
              onPressIn={() => handleButtonPressIn(buttonScale)}
              onPressOut={() => handleButtonPressOut(buttonScale)}
            >
              <ShoppingCart size={20} color="#fff" />
              <Text style={styles.buyText}>Buy</Text>
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.expandBtn}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Feather name="eye" size={20} color="#FFF" />
              <Text style={styles.expandText}>See More</Text>
            </View>
          </View>
        </View>

        {isExpanded && (
          <TouchableWithoutFeedback onPress={toggleExpand}>
            <Animated.View 
              style={[
                styles.detailsContainer,
                {
                  opacity: isExpanded ? 1 : 0,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  zIndex: 20,
                  padding: 16,
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
                }
              ]}
              onLayout={(event) => {
                const height = event.nativeEvent.layout.height;
                if (height > 0 && contentHeight !== height) {
                  setContentHeight(height);
                }
              }}
            >
              <ProductDetails
                description={item.description}
                size={item.size}
                rating={item.rating}
                reviewCount={item.num_ratings}
              />
            </Animated.View>
          </TouchableWithoutFeedback>
        )}

        {/* <ComingSoonOverlay
          isVisible={showComingSoon}
          onClose={() => setShowComingSoon(false)}
        /> */}
        {/* <FeatureDescriptionPopup
          isOpen={!!activeFeature}
          onClose={() => setActiveFeature(null)}
          title={featureTitles[activeFeature] || ''}
          description="Feature description coming soon..."
          icon={featureIcons[activeFeature] || null}
        /> */}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    // backgroundColor: '#ffffff',
    // borderRadius: 12,
    // borderWidth: 1,
    // borderColor: '#e5e7eb',
    // overflow: 'hidden',
    // marginBottom: 16,
    // boxShadow:'0 4px 6px -1px rgba(0,0,0,0.1)), 0 2px 4px -2px rgba(0,0,0,0.1)',

    // shadowColor: '#000',
    // shadowOpacity: 0.1,
    // shadowOffset: { width: 0, height: 2 },
    // shadowRadius: 4,
    // elevation: 2,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 10,
    // borderBottomLeftRadius:16,
    // borderBottomRightRadius:16,
    // borderTopLeftRadius:16,
    // borderTopRightRadius:16,
  },
  disabled: { opacity: 0.5 },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 16,
    padding: 10, // Increased padding
    width: 40,   // Larger width
    height: 40,  // Larger height
    alignItems: 'center',
    justifyContent: 'center',
  },
  deletingButton: {
    backgroundColor: '#fff1f1', 
    borderColor: '#fee2e2',
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 3 / 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 25,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  brandText: {
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#ffffff',
    marginBottom: 4,
  },
  titleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  priceContainer: {
    flexDirection: 'column',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
  oldPrice: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    alignSelf: 'flex-start',
    fontSize: 10,
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(239,68,68,0.9)',
    borderRadius: 12,
    color: '#ffffff',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    justifyContent: 'space-between',
  },
  buyContainer: {
    width: '100%',
    borderRadius: 99999,
    marginRight: 8,
   
    overflow: 'hidden',
    shadowColor: '#000',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: '100%',
    gap:4
  },
  buyText: {
    fontSize: 14,
    fontWeight: 600,
    color: '#ffffff',
    // marginLeft: 4,
  },
  expandBtn: {
    width: '100%',
    backgroundColor: '#f3e8ff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  expandText: {
    fontSize: 14,
    fontWeight: 600,
    color: '#FFFFFF',
    boxShadow: "0 10px 15px -3px rgb(0,0,0,.1), 0 4px 6px -4px rgb(0,0,0,.1)"
  },
  detailsContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
  },
  paginationDots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeButton: {
    position: 'absolute',
    top: 4,
    left: 8,
    zIndex: 10,
    padding: 6,
    flexDirection: 'column',
    alignItems: 'center',
  },
  iconGradient: {
    borderRadius: 16,
    padding: 6,
  },
  loaderContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
