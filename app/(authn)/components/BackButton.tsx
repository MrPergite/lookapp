import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, StyleProp, View } from 'react-native';
import { useRouter } from 'expo-router';
import useAppTheme from '@/hooks/useTheme';
import * as Haptics from "expo-haptics";
import { ChevronLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface BackButtonProps {
  customStyle?: StyleProp<ViewStyle>;
}

const BackButton: React.FC<BackButtonProps> = ({ customStyle = {} }) => {
  const router = useRouter();
  const appTheme = useAppTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('back button pressed', router.canGoBack());
    router.back();
  };

  return (
    <TouchableOpacity
      style={[styles.backButton, customStyle]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#ec4899', '#8b5cf6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <ChevronLeft
          size={28}
          color="#FFFFFF"
        />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default BackButton; 