import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import DeleteOutfitDialog from './DeleteOutfitDialog';
import { Image } from 'expo-image';

interface OutfitItemProps {
  id: string;
  name: string;
  imageUrl: string;
  onDelete: (id: string) => Promise<void>;
}

const OutfitItem: React.FC<OutfitItemProps> = ({
  id,
  name,
  imageUrl,
  onDelete
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting outfit:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View className="relative">
      <View className="rounded-lg overflow-hidden bg-gray-100">
        <Image
          source={{ uri: imageUrl }}
          className="w-full h-48 object-cover"
          contentFit="cover"
        />
        <View className="p-2">
          <Text className="font-medium text-gray-800">{name}</Text>
        </View>
      </View>

      <TouchableOpacity
        className="absolute top-2 right-2 p-2 bg-black/20 rounded-full"
        onPress={() => setShowDeleteDialog(true)}
      >
        <Trash2 size={16} color="#fff" />
      </TouchableOpacity>

      <DeleteOutfitDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />
    </View>
  );
};

export default OutfitItem; 