import React, { useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import OutfitItem from './OutfitItem';
import { useApi } from '@/client-api';
import Toast from 'react-native-toast-message';

interface Outfit {
  id: string;
  outfit_name: string;
  vton_img_url: string;
}

const MyOutfits = () => {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { callProtectedEndpoint } = useApi();

  const handleDeleteOutfit = async (outfitId: string) => {
    try {
      const response = await callProtectedEndpoint(
        `/api/users/vton/outfits/delete?id=${outfitId}`,
        {
          method: "POST",
        }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        // Update the local state by removing the deleted outfit
        setOutfits(outfits.filter(outfit => outfit.id !== outfitId));
        
        Toast.show({
          type: 'success',
          text1: data.message || 'Outfit deleted successfully',
          visibilityTime: 2000
        });
      } else {
        throw new Error(data.error || 'Failed to delete outfit');
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: error instanceof Error ? error.message : 'Error deleting outfit',
        visibilityTime: 2000
      });
      throw error; // Re-throw to be handled by the component
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#9333EA" />
      </View>
    );
  }

  if (outfits.length === 0) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-lg text-gray-500 text-center">
          You haven't saved any outfits yet. Try on items to create and save outfits.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={outfits}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: 8 }}
        columnWrapperStyle={{ gap: 8 }}
        renderItem={({ item }) => (
          <View className="flex-1 p-2">
            <OutfitItem
              id={item.id}
              name={item.outfit_name}
              imageUrl={item.vton_img_url}
              onDelete={handleDeleteOutfit}
            />
          </View>
        )}
      />
    </View>
  );
};

export default MyOutfits; 