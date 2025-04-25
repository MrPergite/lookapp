import React from 'react';
import { Coins } from 'lucide-react-native';
import { View } from 'react-native';
import { Text } from 'react-native';
import { StyleSheet } from 'react-native';

export const VirtualTryonCredits = ({ credits = 0, id = "virtual-tryon-credits" }: { credits: number, id?: string }) => {
    return (
        <View style={styles.creditsButton} className="flex items-center gap-1 p-1.5 rounded-full bg-[#f3f3f3] border-0 cursor-pointer transition-colors" id={id}>
            <View style={styles.creditsIconContainer} className="flex items-center justify-center w-6 h-6 rounded-full bg-white">
                <Coins size={14} color="#333" />
            </View>
            <Text style={styles.creditsText} className="text-xs font-medium text-gray-700 mr-1">{credits}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    creditsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        gap: 8,
    },
    creditsIconContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    creditsText: {

    },
})