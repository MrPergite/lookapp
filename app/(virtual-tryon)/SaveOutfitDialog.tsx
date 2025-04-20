import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Save } from 'lucide-react-native';
import { GradientHeading } from '@/components/auth';

interface SaveOutfitDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    setOutfitName: (name: string) => void;
    outfitName: string;
}

const SaveOutfitDialog: React.FC<SaveOutfitDialogProps> = ({
    isOpen,
    onClose,
    onSave,
    setOutfitName,
    outfitName
}) => {
    const handleQuickSave = () => {
        onSave();
        onClose();
    };

    const handleSaveWithName = () => {
        onSave();
        setOutfitName("");
        onClose();
    };

    return (
        <Modal
            visible={isOpen}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-center items-center bg-black/50">
                <View className="w-[90%] max-w-[425px] p-0 bg-white rounded-2xl overflow-hidden">
                    <View className="p-6 gap-6">
                        <View>
                            <GradientHeading additionalStyles={{ textAlign: 'center' }} text="Save Your Look" />
                        </View>

                        <View className="gap-4">
                            <TouchableOpacity
                                onPress={handleQuickSave}
                                className="w-full rounded-xl overflow-hidden"
                            >
                                <LinearGradient
                                    colors={['#8B5CF6', '#EC4899']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="w-full flex-row justify-center items-center"
                                >
                                    <View style={{ justifyContent: 'center' }} className="w-full flex-row items-center gap-2 py-4">
                                        <Save size={16} color="white" />
                                        <Text className="text-white font-medium">Quick Save</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>

                            <View className="gap-3">
                                <TextInput
                                    value={outfitName}
                                    onChangeText={setOutfitName}
                                    placeholder="Or name your outfit..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50"
                                />
                                <TouchableOpacity
                                    onPress={handleSaveWithName}
                                    disabled={!outfitName.trim()}
                                    className={`w-full rounded-xl py-4 border border-purple-200 flex items-center justify-center ${!outfitName.trim() ? 'opacity-50' : ''}`}
                                >
                                    <Text className="text-gray-800">
                                        Save as "{outfitName || '...'}"
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    titleGradient: {
        borderRadius: 8,
        padding: 10,
    },
    titleText: {
        fontSize: 20,
        fontWeight: '600',
        color: 'white',
    }
});

export default SaveOutfitDialog;