import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { AnimatePresence, MotiImage } from 'moti';
import { TouchableOpacity, View } from 'react-native';

interface IImageSlider {
    images: string[];
    productTitle: string;
}

const ImageSlider = ({ images, productTitle }: IImageSlider) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [preloadedImages, setPreloadedImages] = useState<{ [key: string]: boolean }>({});
    const [prevImageIndex, setPrevImageIndex] = useState<number | null>(null);

    // Preload images when component mounts
    useEffect(() => {
        const preloadImages = async () => {
            if (!images || images.length === 0) return;

            // Preload current image first
            await preloadImage(images[currentIndex]);

            // Then preload the rest in background
            const imgPromises = images.map((src, index) => {
                if (index !== currentIndex) {
                    return preloadImage(src);
                }
                return Promise.resolve();
            });

            await Promise.all(imgPromises);
        };

        preloadImages();
    }, [images]);

    const preloadImage = (src: string) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                setPreloadedImages(prev => ({
                    ...prev,
                    [src]: true
                }));
                resolve(void 0);
            };
            img.onerror = () => resolve(void 0); // Still resolve on error
        });
    };

    const goToNext = () => {
        setPrevImageIndex(currentIndex);
        const nextIndex = (currentIndex + 1) % images.length;

        // Only set loading if the image isn't preloaded
        if (!preloadedImages[images[nextIndex]]) {
            setImageLoaded(false);
        }

        setCurrentIndex(nextIndex);
    };

    const goToPrevious = () => {
        setPrevImageIndex(currentIndex);
        const prevIndex = (currentIndex - 1 + images.length) % images.length;

        // Only set loading if the image isn't preloaded
        if (!preloadedImages[images[prevIndex]]) {
            setImageLoaded(false);
        }

        setCurrentIndex(prevIndex);
    };

    const handleImageLoad = () => {
        setImageLoaded(true);
    };

    return (
        <View className="relative w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            {/* Background placeholder - matches product card background */}
            <View className="absolute inset-0 bg-white dark:bg-gray-900" />

            {/* Loading indicator - only shown when image isn't preloaded */}
            {!imageLoaded && !preloadedImages[images[currentIndex]] && (
                <View className="absolute inset-0 w-full h-full bg-white dark:bg-gray-900 flex items-center justify-center">
                    <View className="w-12 h-12 border-4 border-t-purple-600 border-purple-200 rounded-full animate-spin"></View>
                </View>
            )}

            {/* Image carousel */}
            {images && images.length > 0 && (
                <AnimatePresence >
                    <MotiImage
                        key={currentIndex}
                        from={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        src={images[currentIndex]}
                        alt={`${productTitle} - Image ${currentIndex + 1}`}
                        className="w-full h-full object-cover z-10"
                        onLoad={handleImageLoad}
                        style={{ maxHeight: '100%' }}
                        resizeMode="cover"
                    />
                </AnimatePresence>
            )}

            {images.length > 1 && (
                <>
                    <TouchableOpacity
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full z-20"
                        onPress={goToPrevious}
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full z-20"
                        onPress={goToNext}
                    >
                        <ChevronRight className="h-6 w-6" />
                    </TouchableOpacity>

                    <View className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                        {images.map((_, index) => (
                            <View
                                key={index}
                                className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex ? 'bg-white' : 'bg-white/50'
                                    }`}
                            />
                        ))}
                    </View>
                </>
            )}
        </View>
    );
};

export default ImageSlider;