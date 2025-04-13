import React from 'react';
import { Text, TextProps, TextStyle, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientTextProps extends TextProps {
    children: React.ReactNode;
    style?: TextStyle;
    gradientColors: string[];
    start?: { x: number, y: number };
    end?: { x: number, y: number };
}

const GradientText = ({ children, style, gradientColors = [], start = { x: 0, y: 0 }, end = { x: 1, y: 0 }, ...rest }: GradientTextProps) => {
    return (
        <MaskedView
            maskElement={
                <Text style={style} {...rest}>
                    {children}
                </Text>
            }>
            <LinearGradient
                colors={gradientColors as [string, string, ...string[]]}
                start={start}
                end={end}
            >
                <Text style={[style, { opacity: 0 }]} {...rest}>
                    {children}
                </Text>
            </LinearGradient>
        </MaskedView>
    );
};

export default GradientText;