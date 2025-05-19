import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import useAppTheme from '@/hooks/useTheme';
import * as Haptics from "expo-haptics";
import { ChevronLeft } from 'lucide-react-native';

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
      activeOpacity={1}
    >
      <ChevronLeft
        onPress={handlePress}
        size={28}
        color={appTheme.colors.secondary.black}
      />
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default BackButton; 