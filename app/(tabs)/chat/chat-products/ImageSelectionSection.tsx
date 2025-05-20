import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Image } from 'expo-image';

interface ImageSelectionSectionProps {
    imageUrls: { img_url: string }[];
    onImageSelect?: (url: string) => void;
}

const ImageSelectionSection: React.FC<ImageSelectionSectionProps> = ({ imageUrls, onImageSelect }) => {
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
    console.log("imageUrls", imageUrls);
    return (
        <View style={styles.wrapper}>
            <View style={styles.promptRow}>
                <Text style={styles.label}>L.</Text>
                <Text style={styles.promptText}>Please select the image{imageUrls.length > 1 ? 's' : ''} where you are looking for a fashion item</Text>
            </View>
            <View style={styles.selectionContainer}>
                {imageUrls.map((url) => (
                    <TouchableOpacity
                        key={url.img_url}
                        style={[
                            styles.imageBox,
                            selectedUrl === url.img_url && styles.selectedBox
                        ]}
                        activeOpacity={0.85}
                        onPress={() => {
                            setSelectedUrl(url.img_url);
                            if (onImageSelect) onImageSelect(url.img_url);
                        }}
                    >
                        <Image source={{ uri: url.img_url }} style={styles.image} contentFit='cover' />
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 24,
    },
    promptRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 18,
        width: '85%',
    },
    label: {
        color: '#A259FF',
        fontWeight: 'bold',
        fontSize: 28,
        marginRight: 10,
        marginTop: -2,
        letterSpacing: 0.5,
    },
    promptText: {
        color: '#222',
        fontSize: 18,
        fontWeight: '400',
        flex: 1,
        lineHeight: 24,
    },
    selectionContainer: {
        backgroundColor: '#fff',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 2,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 220,
        minHeight: 180,
    },
    imageBox: {
        borderRadius: 14,
        borderWidth: 2,
        borderColor: 'transparent',
        overflow: 'hidden',
        margin: 4,
        width: 160,
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedBox: {
        borderColor: '#A259FF',
        borderWidth: 3,
    },
    image: {
        width: 150,
        height: 170,
        borderRadius: 12,
        resizeMode: 'cover',
    },
});

export default ImageSelectionSection; 