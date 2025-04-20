import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface DeleteOutfitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

const DeleteOutfitDialog: React.FC<DeleteOutfitDialogProps> = ({
  isOpen,
  onClose,
  onDelete,
  isDeleting = false
}) => {
  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="w-[90%] max-w-[425px] bg-white rounded-2xl overflow-hidden">
          <View className="p-6 space-y-6">
            <Text className="text-2xl font-bold text-center text-gray-900">
              Delete Outfit
            </Text>
            
            <Text className="text-center text-gray-500 text-base">
              Are you sure you want to delete this outfit? This action cannot be undone.
            </Text>
            
            <View className="space-y-3 mt-4">
              <TouchableOpacity
                onPress={onDelete}
                disabled={isDeleting}
                className="w-full py-4 bg-[#141B2D] rounded-xl flex items-center justify-center"
              >
                <Text className="text-white font-medium">
                  {isDeleting ? "Deleting..." : "Delete"}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={onClose}
                disabled={isDeleting}
                className="w-full py-4 border border-gray-200 rounded-xl flex items-center justify-center"
              >
                <Text className="text-gray-800 font-medium">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DeleteOutfitDialog; 