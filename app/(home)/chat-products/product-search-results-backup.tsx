import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  ActivityIndicator,
  useColorScheme,
  TextInput,
  KeyboardAvoidingView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThumbsUp, ThumbsDown, Bookmark, User, UserIcon, Camera, ArrowUp, Search, Mic } from 'lucide-react-native';
import { ThemedText } from '@/components/ThemedText';
import theme, { lightTheme, darkTheme } from '@/styles/theme';
import { ChatMessage } from './context';
import useAppTheme from '@/hooks/useTheme';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2; // Two items per row with spacing
const PRODUCTS_PER_GROUP = 4; // Max products to show per query group

interface Product {
  id: string;
  brand: string;
  name: string;
  price: string;
  image: string;
  isSaved?: boolean;
}

interface ProductSearchResultsProps {
  products: Product[];
  title: string;
  subtitle: string;
  chatHistory: ChatMessage[];
  isLoading?: boolean;
  onProductPress?: (product: Product) => void;
  onSeeMorePress?: () => void;
  onBack: () => void;
}

interface ConversationGroup {
  userMessage: ChatMessage | null;
  aiMessage: ChatMessage | null;
  products: Product[];
  expanded: boolean;
}

const ProductSearchResults: React.FC<ProductSearchResultsProps> = ({
  products = [],
  title = "",
  subtitle = "",
  chatHistory = [],
  isLoading = false,
  onProductPress,
  onSeeMorePress,
  onBack,
}) => {
  const [savedProducts, setSavedProducts] = useState<Record<string, boolean>>({});
  const scrollViewRef = useRef<ScrollView | null>(null);
  const colorScheme = useColorScheme();
  const appTheme = useAppTheme();

  // Group the chat history and products into conversation pairs
  const conversationGroups = useMemo(() => {
    const groups: ConversationGroup[] = [];

    // Skip if we don't have enough messages
    if (chatHistory.length < 2) {
      return groups;
    }

    // Process chat history in pairs of user/AI messages
    for (let i = 0; i < chatHistory.length; i += 2) {
      const userMessage = chatHistory[i]?.role === 'user' ? chatHistory[i] : null;
      const aiMessage = chatHistory[i + 1]?.role === 'ai' || chatHistory[i + 1]?.role === 'ai'
        ? chatHistory[i + 1]
        : null;

      if (userMessage) {
        // Determine product slice for this conversation
        // In a real app, you'd need a proper way to associate products with conversations
        // For now, we'll divide the products evenly among the conversation groups

        // Each group starts with collapsed products
        groups.push({
          userMessage,
          aiMessage,
          products: [], // We'll distribute products later
          expanded: false
        });
      }
    }

    // Distribute products to each conversation group
    // For now, simply divide products evenly among the groups
    const productsPerGroup = Math.ceil(products.length / Math.max(1, groups.length));
    groups.forEach((group, index) => {
      const start = index * productsPerGroup;
      const end = Math.min(start + productsPerGroup, products.length);
      group.products = products.slice(start, end);
    });

    return groups;
  }, [chatHistory, products]);

  // Scroll to bottom when new messages arrive
  // useEffect(() => {
  //   if (scrollViewRef.current) {
  //     setTimeout(() => {
  //       scrollViewRef.current?.scrollToEnd({ animated: true });
  //     }, 300);
  //   }
  // }, [chatHistory.length]);

  const toggleSave = (productId: string) => {
    setSavedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});

  const toggleGroupExpansion = (groupIndex: number) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupIndex]: !prev[groupIndex]
    }));
  };

  const renderProduct = (item: Product, index: number) => {
    const isSaved = savedProducts[item.id] || false;

    return (
      <View key={`product-${item.id}`} style={styles.productItem}>
        <TouchableOpacity
          style={styles.productTouchable}
          activeOpacity={0.7}
          onPress={() => onProductPress && onProductPress(item)}
        >
          <View style={styles.imageWrapper}>
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={40} color="#a8a8a8" />
                <Text style={styles.placeholderText}>No image available</Text>
              </View>
            )}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
              locations={[0, 0.6, 1]}
              style={styles.imageGradient}
            >
              <View style={styles.productLabel}>
                <Text style={styles.productLabelText} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.productPriceLabel}>{item.price}</Text>
              </View>
            </LinearGradient>

            <View style={styles.actionOverlay}>
              <View style={styles.leftActions}>
                <TouchableOpacity style={styles.actionIconButton}>
                  <ThumbsUp size={18} color="#fff" strokeWidth={2} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionIconButton}>
                  <ThumbsDown size={18} color="#fff" strokeWidth={2} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.bookmarkButton}
                onPress={() => toggleSave(item.id)}
              >
                <Bookmark
                  size={22}
                  color="#ffffff"
                  fill={isSaved ? "#ffffff" : "none"}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMessageAvatar = useCallback((message: ChatMessage) => {
      if (message.role === 'user') {
        return (
          <View style={styles.messageContainer}>
            <View style={styles.userMessageContainer}>
              <LinearGradient
                colors={[theme.colors.primary.purple, theme.colors.primary.pink]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.userMessageGradient}
              >
                <Text style={styles.messageText}>{message.text}</Text>
                {message.image && (
                  <Image
                    source={{ uri: message.image }}
                    style={styles.messageImage}
                    resizeMode="contain"
                  />
                )}
              </LinearGradient>
            </View>
            <View style={styles.userAvatarContainer}>
              <UserIcon size={28} color={appTheme.colors.text} style={styles.userAvatarBackground} />
            </View>
          </View>
        )
      }
      return (
        <View style={styles.aiMessageContainer}>
          <Image source={require('@/assets/images/ai-message-avatar.png')} style={styles.avatarContainer} />
          <View style={styles.aiMessage}>
            <Text style={[styles.messageText, { color: theme.colors.secondary.black }]}>{message.text}</Text>
          </View>
        </View>
      )
    
  }, [chatHistory]);

  // Render a conversation group with its products
  const renderConversationGroup = (group: ConversationGroup, index: number) => {
    const isExpanded = expandedGroups[index] || false;
    const productsToShow = isExpanded ? group.products : group.products.slice(0, PRODUCTS_PER_GROUP);
    const hasMoreProducts = group.products.length > PRODUCTS_PER_GROUP;

    return (
      <View key={`group-${index}`} style={[styles.conversationGroup, { borderBottomColor: appTheme.colors.border }]}>
        {/* User message */}
        {group.userMessage && renderMessageAvatar(group.userMessage)}

        {/* AI response */}
        {group.aiMessage && renderMessageAvatar(group.aiMessage)}

        {/* Products for this conversation */}
        {productsToShow.length > 0 && (
          <View style={styles.productSection}>
            <View style={styles.productGrid}>
              {productsToShow.map((item, pIndex) => (
                <View
                  key={`group-${index}-product-${item.id}`}
                  style={pIndex % 2 === 0 ? styles.productItemLeft : styles.productItemRight}
                >
                  {renderProduct(item, pIndex)}
                </View>
              ))}
            </View>

            {/* See More button - only if there are more products to show */}
            {hasMoreProducts && !isExpanded && (
              <TouchableOpacity
                style={styles.seeMoreButton}
                onPress={() => toggleGroupExpansion(index)}
              >
                <ThemedText style={styles.seeMoreText}>See More</ThemedText>
              </TouchableOpacity>
            )}

            {/* See Less button - shown when expanded */}
            {isExpanded && hasMoreProducts && (
              <TouchableOpacity
                style={styles.seeMoreButton}
                onPress={() => toggleGroupExpansion(index)}
              >
                <ThemedText style={styles.seeMoreText}>See Less</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  // Main render method
  return (
    <View style={styles.mainContainer}>
      <View style={styles.container}>
        {/* Header */}
        {/* <View style={[styles.header, { borderBottomColor: appTheme.colors.border, backgroundColor: appTheme.colors.card }]}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={appTheme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: appTheme.colors.text }]}>Shopping Assistant</Text>
        </View> */}

        {/* If there are no conversation groups yet, show all chat history */}
        {conversationGroups.length === 0 ? (
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            style={styles.chatHistoryContainer}
          >
            {chatHistory.map((message, index) => (
              <View key={`message-${index}`} style={message.role === 'user' ? styles.messageContainer : styles.aiMessageContainer}>
                {message.role === 'ai' ? renderMessageAvatar(message) : renderMessageAvatar(message)}
              </View>
            ))}

            {/* Loading state */}
            {isLoading && (
              <View style={styles.aiMessageContainer}>
                <View style={styles.avatarContainer}>
                  <LinearGradient
                    colors={[theme.colors.primary.pink, theme.colors.primary.purple]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarGradient}
                  >
                    <Text style={styles.avatarText}>L</Text>
                  </LinearGradient>
                </View>
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#6b5cd1" />
                  <Text style={styles.loadingText}>Finding products for you...</Text>
                </View>
              </View>
            )}

            {/* Product grid if products but no conversation groups */}
            {products.length > 0 && (
              <View style={styles.productSection}>
                <View style={styles.productGrid}>
                  {products.slice(0, PRODUCTS_PER_GROUP).map((item, index) => (
                    <View
                      key={`initial-${item.id}`}
                      style={index % 2 === 0 ? styles.productItemLeft : styles.productItemRight}
                    >
                      {renderProduct(item, index)}
                    </View>
                  ))}
                </View>

                {/* See More button */}
                {products.length > PRODUCTS_PER_GROUP && (
                  <TouchableOpacity
                    style={styles.seeMoreButton}
                    onPress={onSeeMorePress}
                  >
                    <ThemedText style={styles.seeMoreText}>See More</ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        ) : (
          /* Render conversation groups and their associated products */
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            style={styles.chatHistoryContainer}
          >
            {conversationGroups.map(renderConversationGroup)}

            {/* Loading state */}
            {isLoading && (
              <View style={styles.aiMessageContainer}>
                <View style={styles.avatarContainer}>
                  <LinearGradient
                    colors={[theme.colors.primary.pink, theme.colors.primary.purple]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarGradient}
                  >
                    <Text style={styles.avatarText}>L</Text>
                  </LinearGradient>
                </View>
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#6b5cd1" />
                  <Text style={styles.loadingText}>Finding products for you...</Text>
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

// Styles don't include colors - they're applied dynamically based on theme
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: theme.colors.primary.lavender,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary.lavender,
  },
  contentContainer: {
    paddingBottom: 100, // Space for input box
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    position: 'absolute',
    top: 0,
    zIndex: 1000,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  chatHistoryContainer: {
    padding: 16,
    backgroundColor: theme.colors.primary.paleWhite,
    margin: theme.spacing.md,
    borderRadius: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    opacity: 0.9,
  },
  conversationGroup: {
    marginBottom: 24,
    borderBottomWidth: 0,
    paddingBottom: 16,
  },
  messageContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    width: '100%',
  },
  aiMessageContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  avatarContainer: {
    marginRight: 12,
    height: 36,
    width: 36,
    backgroundColor: theme.colors.primary.white,
    borderRadius: 18,
  },
  avatarGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  userAvatarContainer: {
    padding: 10,
  },
  userAvatarBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary.lavender,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  userAvatarText: {
    color: theme.colors.secondary.darkGray,
    fontSize: 16,
    fontWeight: '500',
  },
  userMessageContainer: {
    maxWidth: '75%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  userMessageGradient: {
    padding: 16,
    borderRadius: 20,
  },
  userMessage: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#f0e6ff',
    maxWidth: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  aiMessage: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: theme.colors.primary.white,
    maxWidth: '75%',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    color: theme.colors.primary.white,
    lineHeight: 22,
  },
  messageImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.white,
    maxWidth: '75%',
    flex: 1,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 16,
    color: theme.colors.secondary.darkGray,
  },
  productSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    justifyContent: 'space-between',
  },
  productItemLeft: {
    width: '48.5%',
    marginBottom: 16,
  },
  productItemRight: {
    width: '48.5%',
    marginBottom: 16,
  },
  productItem: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productTouchable: {
    width: '100%',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: 340,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    marginTop: 8,
    color: '#777777',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    justifyContent: 'flex-end',
    paddingBottom: 60,
    paddingHorizontal: 16,
  },
  productLabel: {
    width: '100%',
  },
  productLabelText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 5,
    lineHeight: 24,
  },
  productPriceLabel: {
    fontSize: 20,
    fontWeight: '500',
    color: '#ffffff',
    lineHeight: 24,
  },
  actionOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primary.purple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkButtonActive: {
    backgroundColor: '#6b5cd1',
  },
  productBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    paddingRight: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6b5cd1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f7f7f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeBtn: {
    backgroundColor: '#6b5cd1',
  },
  seeMoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.primary.white,
  },
  seeMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary.veryDarkGray,
    fontFamily: 'default-semibold',
  },

  // New footer styles
  chatFooter: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f2f2f7',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  messageInput: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 10,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  plusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  plusButtonText: {
    fontSize: 18,
    color: '#000',
    fontWeight: '300',
  },
  actionButton: {
    marginRight: 8,
  },
  actionButtonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#000',
  },
  disclaimerText: {
    textAlign: 'center',
    fontSize: 14,
    color: theme.colors.secondary.darkGray,
    marginTop: 8,
  },
});

export default ProductSearchResults; 