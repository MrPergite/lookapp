import React, { memo } from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet, Dimensions } from 'react-native';
import { User, Sparkles, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GradientText from '@/components/GradientText';
import { responsiveFontSize } from '@/utils';
import { Image } from 'expo-image';

interface Avatar {
    id: string;
    name: string;
    src: string;
}

interface AvatarSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    avatars: Avatar[];
    selectedAvatar?: Avatar | null;
    onAvatarSelect: (avatar: Avatar) => void;
    hasCustomAvatars?: boolean;
    onViewCustomAvatars?: () => void;
    avatarStatus?: string;
    customAvatars?: Avatar[];
}

const AvatarSelector = memo<AvatarSelectorProps>(({
    open,
    onOpenChange,
    avatars,
    selectedAvatar,
    onAvatarSelect,
    hasCustomAvatars = false,
    onViewCustomAvatars,
    avatarStatus = '',
    customAvatars = []
}) => {
    const renderAvatar = ({ item }: { item: Avatar }) => (
        <TouchableOpacity
            key={item.id}
            onPress={() => {
                onAvatarSelect(item);
                onOpenChange(false);
            }}
            style={[
                styles.avatarItem,
                (selectedAvatar?.id === item.id || selectedAvatar?.src === item.src) && styles.selectedAvatar,
            ]
            }
            className="mb-2 rounded-lg overflow-hidden"
        >
            <Image
                source={{ uri: item.src }}
                style={styles.avatarImage}
                contentFit='cover'
                transition={100}
                contentPosition={"top center"}
                alt={item.name}
            />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={styles.nameGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            >
                <View className="flex-row items-center">
                    <Sparkles size={12} color="#FBBF24" style={{ marginRight: 4 }} />
                    <Text style={styles.avatarName} className="text-white text-xs font-medium">
                        {item.name}
                    </Text>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={open}
            transparent={true}
            animationType="fade"
            onRequestClose={() => onOpenChange(false)}
        >
            <View className="flex-1 justify-center items-center bg-black/50 px-4">
                <View className="w-full max-w-[380px] bg-white rounded-xl p-3">
                    <View className="mb-4 flex-row justify-between items-center">
                        <View />
                        <GradientText
                            gradientColors={['#EC4899', '#8B5CF6', '#6366F1']}
                            className="text-base font-medium text-center"
                            style={styles.titleText}
                        >
                            Choose Your Avatar
                        </GradientText>
                        <View className="flex-row justify-end">
                            <TouchableOpacity onPress={() => onOpenChange(false)}>
                                <X size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="p-2">
                        <FlatList
                            data={avatars}
                            renderItem={renderAvatar}
                            keyExtractor={(item) => item.id}
                            numColumns={2}
                            columnWrapperStyle={{ justifyContent: 'space-between', gap: 12 }}
                            showsVerticalScrollIndicator={false}
                            style={{ maxHeight: Dimensions.get('window').height - 300 }}
                            ItemSeparatorComponent={() => <View style={{ height: 10, width: 10 }} />} // vertical gap
                        />
                    </View>

                    {/* Custom avatars button - Uncomment when needed
          {hasCustomAvatars && avatarStatus !== 'ready' && (
            <View className="mt-2">
              <TouchableOpacity
                onPress={() => {
                  onViewCustomAvatars?.();
                  onOpenChange(false);
                }}
                className="w-full py-3 rounded-lg overflow-hidden"
              >
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <View className="flex-row items-center justify-center">
                    <Sparkles size={12} color="#fff" style={{ marginRight: 6 }} />
                    <Text className="text-white text-xs font-medium">
                      View My Custom Avatars
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )} */}

                    {/* Create avatar button - Uncomment when needed
          <View className="mt-2 relative">
            <View style={styles.comingSoonTag}>
              <Text className="text-white text-xs bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 rounded-full">
                Coming in early 2025
              </Text>
            </View>
            <TouchableOpacity
              disabled={true}
              style={styles.disabledButton}
              className="w-full py-3 rounded-lg flex-row items-center justify-center border border-purple-200"
            >
              <User size={12} color="#6B7280" style={{ marginRight: 6 }} />
              <Text className="text-gray-500 text-xs">
                Create Your Own Avatar
              </Text>
            </TouchableOpacity>
          </View> */}
                </View>
            </View>
        </Modal>
    );
});

const styles = StyleSheet.create({
    titleGradient: {
        borderRadius: 8,
        padding: 8,
    },
    titleText: {
        fontSize: responsiveFontSize(16),
        fontFamily: 'Inter-Medium',
        
    },
    avatarItem: {
        width: "48%",
        aspectRatio: 3 / 4,
        borderRadius: 8,
        overflow: 'hidden',
    },
    selectedAvatar: {
        borderWidth: 4,
        borderColor: '#8B5CF6',
    },
    avatarImage: {
        width: "100%",
        height: "140%",
    },
    nameGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 6,
    },
    buttonGradient: {
        padding: 12,
        borderRadius: 8,
    },
    comingSoonTag: {
        position: 'absolute',
        top: -10,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 10,
    },
    disabledButton: {
        opacity: 0.7,
    },
    avatarName: {
        fontSize: responsiveFontSize(12),
        fontFamily: 'Inter-Medium',
    },
});

AvatarSelector.displayName = 'AvatarSelector';
export default AvatarSelector;