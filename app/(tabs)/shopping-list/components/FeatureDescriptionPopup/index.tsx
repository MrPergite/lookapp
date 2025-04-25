import React, { useEffect } from 'react';
import { Modal, Text, View, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { MotiView } from 'moti';
import { X } from 'lucide-react-native';

interface IFeatureDescriptionPopup {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    icon: any;
}

const FeatureDescriptionPopup = ({ isOpen, onClose, title, description, icon: Icon }: IFeatureDescriptionPopup) => {
    // Log when modal opens or closes for debugging
    useEffect(() => {
        console.log(`Modal visibility changed to: ${isOpen ? 'visible' : 'hidden'}`);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <Modal
            visible={isOpen}
            onRequestClose={onClose}
            transparent={true}
            animationType="fade"
            statusBarTranslucent={true}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View className="flex-1 justify-center items-center bg-black/50">
                    <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                        <View className="w-11/12 bg-white rounded-2xl overflow-hidden">
                            <View className="relative p-6">
                                <TouchableOpacity
                                    onPress={onClose}
                                    className="absolute right-5 top-5 z-10"
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <X size={24} color="#666" />
                                </TouchableOpacity>

                                <View className="flex-row items-center mb-4 mt-2">
                                    {Icon && <Icon size={24} color="#9b87f5" className="opacity-80" />}
                                    <Text className="text-2xl font-bold text-black ml-2">
                                        {title}
                                    </Text>
                                </View>

                                <Text className="text-gray-500 text-base">
                                    {description || "Feature description coming soon..."}
                                </Text>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

export default FeatureDescriptionPopup;