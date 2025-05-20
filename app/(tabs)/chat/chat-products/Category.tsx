import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';

interface CategoryProps {
  name: string;
  onPress?: () => void;
}

const Category: React.FC<CategoryProps> = ({ name, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="flex-row items-center flex-wrap bg-white rounded-xl px-2 py-1 shadow-sm m-1"
      style={{ minWidth: 50 }}
    >
      <View className="bg-purple-500/20 rounded-full p-2 mr-2">
        <ShoppingBag size={16} color="#a259ff" />
      </View>
      <Text className="text-md font-semibold text-black">
        {name}
      </Text>
    </TouchableOpacity>
  );
};

export default Category; 