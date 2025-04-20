

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
import { MotiScrollView, MotiText, MotiView } from 'moti';
import { responsiveFontSize } from '@/utils';
import { MessageCircle, ShoppingCart, Sparkles, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import GradientText from '@/components/GradientText';
import ProductCard from './ProductCard';
import { PRODUCTS } from '@/constants';
import DeleteOutfitDialog from '../DeleteOutfitDialog';
import { Image } from 'expo-image';

interface TabSectionProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleTabChange: (tab: string) => void;
  isExpanded: boolean;
  products: any[];
  selectedProduct: any;
  loadingShoppingProductId: string;
  savedOutfits: any[];
  handleOutfitClick: (outfit: any) => void;
  handleProductSelect: (product: any) => void;
  onDeleteOutfit: (outfitId: string) => void;
  setOutfitToDelete: (outfitId: string) => void;
  deleteOutfit: (outfitId: string) => void;
  outfitToDelete: string;
  isLoading: boolean;
  deleting: boolean;
  setShowModal: (showModal: boolean) => void;
  showModal: boolean;
  isAvatarLoading: boolean;
  setIsExpanded: (isExpanded: boolean) => void;
}

const EmptyState = () => (
  <ScrollView style={{ marginBottom: 50 }}>
    <View className="flex flex-col items-center justify-center pt-8">
      <View className="text-center space-y-4 sm:space-y-6 max-w-[280px] sm:max-w-md mx-auto">
        <View
          style={styles.cartIconContainer}>
          <ShoppingCart
            style={styles.cartIcon}
            size={24} color="#8b5cf6"
          />
        </View>
        <View className="space-y-2">

          <GradientText gradientColors={['#9b87f5', '#7E69AB']} style={styles.emptyTitle}>Your shopping list is empty</GradientText>
          <Text
            style={styles.emptySubtitle}>
            Start a chat to discover and save items to your shopping list
          </Text>
        </View>
        <MotiView
          className="hidden sm:flex flex-col items-center space-y-2 pt-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)" as any)}
            className="bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] text-white hover:from-[#8b77e5] hover:to-[#6E59A5] transition-all duration-300 rounded-full shadow-lg hover:shadow-xl dark:shadow-purple-500/20"
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </TouchableOpacity>
          <MotiText
            className="text-xs sm:text-sm text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            Go to chat
          </MotiText>
        </MotiView>
      </View>
    </View>
  </ScrollView>
);

const EmptyOutfits = () => (
  <MotiView
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4"
  >
    <View style={styles.emptyOutfitsContainer} className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-2">
      <Sparkles size={32} color="#9333ea" style={styles.emptyOutfitsIcon} className="w-8 h-8 text-purple-600 dark:text-purple-400" />
    </View>
    <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">
      No saved outfits yet
    </Text>
    <Text className="text-sm text-gray-500 dark:text-gray-400 max-w-[250px]">
      Try on different items and save your favorite combinations to see them
      here
    </Text>
  </MotiView>
);

function TabSection({ activeTab, setActiveTab,
  handleTabChange,
  isExpanded,
  products,
  selectedProduct,
  loadingShoppingProductId,
  savedOutfits,
  handleOutfitClick,
  handleProductSelect,
  onDeleteOutfit,
  setOutfitToDelete,
  deleteOutfit,
  outfitToDelete,
  isLoading,
  deleting,
  setShowModal,
  showModal,
  isAvatarLoading,
  setIsExpanded, }: TabSectionProps) {
  const { isSignedIn } = useAuth();
  const isMyOutfitsExpanded = activeTab === "my-outfits" && isExpanded;
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handleDeleteClick = (outfit) => {
    setOutfitToDelete(outfit);
    setShowModal(true);
  };

  const handleConfirmDelete = () => {
    deleteOutfit(outfitToDelete);
  };

  const handleProductCardClick = (product) => {
    if (!isAvatarLoading) {
      handleProductSelect(product);
    }
  };

  const { height: screenHeight } = Dimensions.get('window');


  return (
    <>
      {isMyOutfitsExpanded && (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-white z-40"
        />
      )}
      <MotiView
        className={`fixed top-4 bottom-0 left-0 right-0 bg-gray-50/95 rounded-t-3xl relative ${isMyOutfitsExpanded ? "z-50" : "z-10"}`}
        animate={{
          transform: [{ translateY: isMyOutfitsExpanded ? -80 : 0 }],
          height: isMyOutfitsExpanded ? screenHeight * 1 : screenHeight * 0.4,
        }}
        transition={{
          type: "spring",
          damping: 20,
          stiffness: 100
        }}

        style={{
          height: isMyOutfitsExpanded ? screenHeight : "auto",
          maxHeight: isMyOutfitsExpanded ? screenHeight  : 220
        }}>
        <View style={styles.container}>
          <View className='
          items-center justify-center text-muted-foreground grid grid-cols-2 gap-2 bg-white/90 p-1.5 
          rounded-2xl backdrop-blur-xl border border-gray-200/50
          shadow-sm' style={styles.tabContainer}>
            {
              isSignedIn ? (
                <>
                  <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'shopping-list' && styles.activeTab]}
                    onPress={() => setActiveTab('shopping-list')}
                  >
                    <Text
                      className={`${activeTab !== 'shopping-list' && 'text-gray-500'}`}
                      style={[styles.tabText, activeTab === 'shopping-list' && styles.activeTabText]}>
                      Shopping List
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'my-outfits' && styles.activeTab]}
                    onPress={() => setActiveTab('my-outfits')}
                  >
                    <Text
                      className={`${activeTab !== 'my-outfits' && 'text-gray-500'}`}
                      style={[styles.tabText, activeTab === 'my-outfits' && styles.activeTabText]}>
                      My Outfits
                    </Text>
                  </TouchableOpacity>
                </>
              ) :
                <View style={[styles.tabButton, styles.activeTab]}>
                  <Text style={[styles.tabText, styles.activeTabText]}>
                    Preview Mode
                  </Text>
                </View>
            }
          </View>



          {
            isSignedIn && (
              <>
                {activeTab === "shopping-list" &&
                  <View>
                    <View className='mt-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none px-4 h-full' >
                      {isLoading ? (
                        <View className="px-4 pb-20 overflow-hidden">
                          <View className="overflow-x-auto p-2">
                            <View className="flex flex-row gap-3" style={{ width: "100%" }}>
                              {[1, 2, 3].map((i) => (
                                <View
                                  key={i}
                                  className="w-[95px] h-[95px] bg-gray-200 dark:bg-gray-800/50 rounded-lg flex-shrink-0 animate-pulse"
                                ></View>
                              ))}
                            </View>
                          </View>
                        </View>
                      ) : (

                        <View className="grid grid-cols-1 gap-4 pb-20 overflow-hidden">
                          {products.length === 0 ? (
                            <EmptyState />
                          ) : (
                            <View className="overflow-x-auto p-2">
                              <MotiScrollView contentContainerStyle={{ gap: 20 }} style={styles.productListContainer} horizontal className="flex flex-row gap-12 ">
                                {products.map((product) => (
                                  <View key={product.id} >
                                    <ProductCard
                                      id={product.id}
                                      state={product.state}
                                      product={product}
                                      isSelected={selectedProduct?.id === product.id}
                                      onSelect={() => handleProductSelect(product)}
                                      isLoading={loadingShoppingProductId === product.id}
                                      isDisabled={isAvatarLoading}
                                    />
                                  </View>
                                ))}
                              </MotiScrollView>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  </View>}


                {activeTab === "my-outfits" && <View
                  className="mt-4 focus-visible:outline-none px-4 h-[calc(100vh-200px)] overflow-y-auto pb-20"
                >
                  {savedOutfits.length === 0 ? (
                    <EmptyOutfits />
                  ) : (
                    <View className="flex flex-row flex-wrap gap-4 p-4">
                      {savedOutfits.map((outfit) => (
                        <Pressable
                          key={outfit.id}
                          onPress={() => {
                            handleOutfitClick(outfit);
                            handleTabChange("shopping-list");
                          }}>
                          <MotiView
                            key={outfit.id}
                            className="flex flex-col w-[150px]"
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                          >
                            <View className="relative rounded-2xl overflow-hidden shadow-sm cursor-pointer bg-white dark:bg-gray-800">
                              <Image
                                source={{ uri: outfit.vton_img_url }}
                                alt={outfit.outfit_name}
                                className="w-full aspect-[9/16] object-cover"
                                contentFit="cover"
                                contentPosition='top center'
                                style={{
                                  width: "100%",
                                  height: 280,
                                }}
                              />
                              <TouchableOpacity
                                onPress={() => handleDeleteClick(outfit)}
                                className="absolute top-2 right-2 p-1 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                              >
                                <X color='white' size={responsiveFontSize(16)} className="w-4 h-4" />
                              </TouchableOpacity>
                            </View>
                            <View className="mt-2 px-1">
                              <Text className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate text-center">
                                {outfit.outfit_name}
                              </Text>
                            </View>
                          </MotiView>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>}
              </>
            )
          }


          {!isSignedIn && (
            <View
              className="w-full h-full flex flex-col"

            >
              <View className="flex-1">
                <View >
                  <View className="grid grid-cols-1 gap-4 pb-20 overflow-hidden">
                    {PRODUCTS.length === 0 ? (
                      <EmptyState />
                    ) : (
                      <View className="overflow-x-auto pl-2 pt-2 pb-2">
                        <MotiScrollView contentContainerStyle={{ gap: 20 }} style={styles.productListContainer} horizontal className="flex flex-row gap-12 ">
                          {PRODUCTS.map((product) => (
                            <View key={product.id} >
                              <ProductCard
                                product={product}
                                isSelected={selectedProduct?.id === product.id}
                                onSelect={() => handleProductCardClick(product)}
                                isLoading={loadingShoppingProductId === product.id}
                                isDisabled={isAvatarLoading}
                              />
                            </View>
                          ))}
                        </MotiScrollView>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      </MotiView>
      <DeleteOutfitDialog
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onDelete={handleConfirmDelete}
        isDeleting={deleting}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'fixed',
    width: '100%',
    paddingBottom: 16,
    marginTop: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 100,
    padding: 4,
    marginHorizontal: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',             // inline-flex
    paddingHorizontal: 12,            // px-3
    paddingVertical: 6,               // py-1.5
    borderRadius: 12,                 // rounded-xl
    backgroundColor: 'transparent',
    transitionDuration: '200ms',
  },
  activeTab: {
    backgroundColor: '#f5f3ff',       // bg-purple-50
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  tabText: {
    fontFamily: 'default-medium',
    fontSize: responsiveFontSize(14),                     // text-sm
    fontWeight: '500',               // font-medium
  },
  activeTabText: {
    color: '#6b21a8',
    fontFamily: 'default-semibold',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  cartIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    backgroundColor: '#f5f3ff', // Tailwind's purple-50
    padding: 16,                // p-4 (default)
    alignSelf: 'center',
  },
  emptyTitle: {
    fontSize: responsiveFontSize(20),
    fontFamily: 'default-semibold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: responsiveFontSize(16),
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: responsiveFontSize(20),
  },
  cartIcon: {
    backgroundColor: '#f5f3ff', // Tailwind's bg-purple-50
    borderRadius: 9999,         // rounded-full
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  emptyOutfitsContainer: {
    width: 64,                     // w-16
    height: 64,                    // h-16
    borderRadius: 9999,           // rounded-full
    backgroundColor: '#e9d5ff',   // Tailwind's purple-100
    justifyContent: 'center',     // items-center
    alignItems: 'center',         // justify-center
    marginBottom: 8,
  },
  emptyOutfitsIcon: {

  },
  productListContainer: {
    gap: 20,                    // gap-4 (4 * 4 = 16 px)
    width: '100%',
  },
});

export default TabSection; 
