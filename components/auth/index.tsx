import { StyleSheet } from "react-native";
import GradientText from "../GradientText";



export const GradientHeading = ({ text, additionalStyles }: { text: string; additionalStyles?: StyleSheet.NamedStyles<any> }) => {
    return (
        <GradientText style={[styles.lookPassTitle, {
            ...(additionalStyles && {
                ...additionalStyles
            })
        }]}
            gradientColors={['#9333ea', '#ec4899']} // purple-600 → pink-600
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
        >
            {text}
        </GradientText>
    )
};

const styles = StyleSheet.create({
    lookPassTitle: {
        fontSize: 24,
        fontFamily: 'default-bold',
        color: '#9333EA',
        marginBottom: 4,
    },
});
export { default as PreLoginScreen } from './PreLoginScreen';
export { default as PostLoginScreen } from './PostLoginScreen'; 