import { X } from 'lucide-react-native'
import React from 'react'
import { Image, ScrollView, View } from 'react-native'
import { StyleSheet } from 'react-native'

const ImagePreview = ({ imageUris, onRemoveImage }: { imageUris: string[], onRemoveImage: (uri: string) => void }) => {
    return (
        <ScrollView horizontal contentContainerStyle={styles.container}>
            {imageUris.map((uri, index) => (
                <View style={styles.imageContainer} key={index}>
                    <X size={16} color={"white"} style={styles.closeButton} onPress={() => onRemoveImage(uri)} />
                    <Image source={{ uri: `data:image/jpeg;base64,${uri}` }} style={styles.image} key={index} />
                </View>
            ))}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        width: 100,
        height: 100,
        position: 'relative',
    },
    image: {
        width: 100,
        height: 100,
        borderRadius: 12,
    },
    imageContainer: {
        width: 100,
        height: 100,
        borderRadius: 10,
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: 0,
        right: -4,
        backgroundColor: 'red',
        borderRadius: 10,
        zIndex: 2,
        padding:10
    }
})

export default ImagePreview
