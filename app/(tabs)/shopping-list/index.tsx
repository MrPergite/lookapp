import React, { useState } from 'react';
import { useShoppingList } from '@/app/(tabs)/virtual-tryon/hooks/useShoppingList';
import { useAuth } from '@clerk/clerk-react';
import { MessageCircle, ShoppingCart, ChevronUp, ChevronDown, Trash2, Bell, BarChart2, Tag, MessageSquare, User, Trash } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { TouchableOpacity, View, Image, ScrollView, ActivityIndicator, Pressable, SafeAreaView } from 'react-native';
import { Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { responsiveFontSize } from '@/utils';
import { MotiPressable } from 'moti/interactions';
import SimpleHeader from '../virtual-tryon/SimpleHeader';
import ImageSlider from './components/ImageSlider';
import ListItem from './components/ListItem';
import { GradientHeading } from '@/components/auth';
import GradientText from '@/components/GradientText';

// Product interface
interface Product {
  id: string;
  title: string;
  image: string;
  expanded?: boolean;
}

// Sample products based on the image
const sampleProducts: Product[] = [
  {
    id: '1',
    title: 'Calvin Klein Cotton Crew Neck T-Shirt Pack',
    image: 'https://i.imgur.com/aR7DK9Z.jpg',
    expanded: false
  }
];

export default function ShoppingList() {
  const { isSignedIn } = useAuth();
  const { items, removeItem, isLoading, error, isLoadingShoppingList } = useShoppingList(isSignedIn);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('shopping-list');
  const [isGoToChatPressed, setIsGoToChatPressed] = useState(false);


  const LoadingState = () => (
    <SafeAreaView className="px-4 pb-20">
      {[1, 2, 3].map((i) => (
        <View key={i} className="animate-pulse p-4 my-0">
          <View className="h-56 bg-gray-200 rounded-lg"></View>
        </View>
      ))}
    </SafeAreaView>

  )

  if (error) {
    return (
      <View className="flex-1 bg-white">
        <Text className="text-center text-2xl font-bold py-4 text-purple-500">Shopping List</Text>
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-lg text-red-500">{error}</Text>
        </View>
      </View>
    );
  }

  const EmptyState = () => (
    <View className="flex-1 items-center justify-center px-4 py-12">
      <View className="items-center p-12">
        <View className="bg-purple-50 rounded-full p-6 w-20 h-20 items-center justify-center mb-6">
          <ShoppingCart size={32} color="#9b87f5" />
        </View>
        <GradientText className="text-2xl font-semibold text-center mb-2" gradientColors={['#9b87f5', '#7e69ab']}>
          Your shopping list is empty
        </GradientText>
        <Text className="text-gray-500 text-center mb-6">
          Start a chat to discover and save items to your shopping list
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/chat')}
          className="w-full"
          onLongPress={() => setIsGoToChatPressed(true)}
          onPressOut={() => setIsGoToChatPressed(false)}
        >
          <LinearGradient
            colors={
              isGoToChatPressed
                ? ['#ec4899', '#9333ea'] // hover:from-pink-600 to-purple-600
                : ['#9333ea', '#ec4899', '#3b82f6'] // from-purple-600 via-pink-500 to-blue-500
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <Text style={styles.text}>{"Go to Home Search"}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContent = (items: any[]) => {
    if (isLoadingShoppingList.shoppingListLoading) {
      return <LoadingState />
    }
    return (
      <View className="flex-col gap-4 mt-4">
        {items.map((product) => (
          <ListItem key={product.id} item={product} onRemove={removeItem} isDeleting={isLoadingShoppingList.removeShoppingListLoading} />
        ))}
      </View>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <SimpleHeader title="Shopping List" />

      {/* Content based on active tab */}
      {activeTab === 'shopping-list' ? (
        items.length === 0 && !isLoadingShoppingList.shoppingListLoading ? <EmptyState /> :
          <ScrollView className="flex-1 px-5">
            {renderContent(items)}
          </ScrollView>

      ) : (
        // Digital Wardrobe Tab (Empty state for now)
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-lg text-gray-500">Digital Wardrobe Coming Soon</Text>
        </View>
      )}
    </SafeAreaView>
  );

}


const styles = StyleSheet.create({

  gradient: {
    paddingVertical: 12, // h-11 = 44px, minus padding
    paddingHorizontal: 32, // px-8
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  }
})
