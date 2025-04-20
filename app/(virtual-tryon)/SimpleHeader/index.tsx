import { ThemedText } from '@/components';
import { GradientHeading } from '@/components/auth';
import GradientText from '@/components/GradientText';
import { responsiveFontSize } from '@/utils';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react'
import { View, StyleSheet, Text } from 'react-native';
import { VirtualTryonCredits } from '../VirtualTryonCredits';


function SimpleHeader({ credits }: { credits: number | null }) {
    return (
        <View
            className='flex items-center justify-between p-4 bg-white shadow-sm sticky top-0 z-10'
            style={styles.container}>
            <View className='w-10' />
            {typeof credits === "number" && (
                <VirtualTryonCredits
                    credits={credits}
                    id="virtual-tryon-credits-mobile"
                />
            )}
            <View className='flex-1 text-xl font-semibold text-center bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-transparent bg-clip-text'>
                <View className="flex flex-row items-center justify-center w-full gap-2">
                    <GradientText className='font-semibold' style={styles.gradientText} gradientColors={['#ec4899', '#a855f7', '#6366f1']} children="Virtual Try-On"
                    />
                    <LinearGradient
                        colors={['#8b5cf6', '#ec4899']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className='inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full'
                        style={styles.betaTextContainer}
                    >
                        <Text style={styles.betaText} className='text-white p-2 rounded-full'>Beta</Text>
                    </LinearGradient>
                </View>
            </View>
            <View className='w-10' >

            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    gradientText: {
        fontSize: responsiveFontSize(20),
        fontFamily: 'default-semibold',
        lineHeight: responsiveFontSize(28),
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16, // p-4
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2, // shadow-sm
        elevation: 2, // Android shadow
        zIndex: 10,
        position: 'sticky', // Not supported in RN
        top: 0,
    },
    betaTextContainer: {
        borderRadius: 9999,
        paddingHorizontal: responsiveFontSize(2),
        paddingVertical: responsiveFontSize(2),
    },
    betaText: {
        fontSize: responsiveFontSize(12),
        fontFamily: 'default-bold',
        color: 'white',
        paddingHorizontal: responsiveFontSize(8),
        paddingVertical: responsiveFontSize(2),
        lineHeight: responsiveFontSize(16),
    },
});

export default SimpleHeader;
