import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  ScrollView,
  SafeAreaView,
  Animated
} from 'react-native';
import theme from '@/styles/theme';
import { AVATARS } from '@/constants';
import { useOnBoarding } from '../context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useAnimatedStyle } from 'react-native-reanimated';
import { useSharedValue } from 'react-native-reanimated';
import { withTiming } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Define the Avatar type
interface Avatar {
  id: string;
  name: string;
  src: string;
  gender: string;
}

function SelectAvatars() {
  const { payload, dispatch } = useOnBoarding();
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(payload.pref_avatar_url);
  
  const handleSelection = (avatar: Avatar) => {
    setSelectedAvatar(avatar.src);
    
    // Update context
    if (dispatch) {
      dispatch({
        type: "SET_PAYLOAD",
        payload: { 
          key: "pref_avatar_url", 
          value: avatar.src 
        }
      });
    }
  };

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(scale.value, { duration: 300 }) }],
  }));


  // Only show the first 4 avatars (2x2 grid) as in the image
  const displayAvatars = AVATARS;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContainer}>
        {displayAvatars.map((avatar) => (
          <TouchableOpacity
            key={avatar.id}
            style={[
              styles.avatarCard,
              selectedAvatar === avatar.src && styles.selectedAvatarCard
            ]}
            onPress={() => handleSelection(avatar)}
            activeOpacity={0.9}
            onPressIn={() => (scale.value = 1.02)}
            onPressOut={() => (scale.value = 1)}
          >
            <Animated.View style={[styles.imageContainer,animatedStyle]}>
              <Image 
                source={{ uri: avatar.src }} 
                style={styles.avatarImage}
                contentFit='cover'
                contentPosition={'top'}
              />
            </Animated.View>
            <LinearGradient
              colors={['rgba(0,0,0,0.6)', 'transparent']} // from-black/60 to-transparent
              start={{ x: 0.5, y: 1 }}
              end={{ x: 0.5, y: 0 }}
              style={styles.nameContainer}>
              <Text style={styles.avatarName}>{avatar.name}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView> 
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    paddingTop: 10,
    height: '100%'
  },
  gridContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 16,
    paddingBottom: 240, 
  },
  avatarCard: {
    width: width * 0.4,
    height: width * 0.62,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: "#e9e9e9",
    marginBottom: 16,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedAvatarCard: {
    borderWidth: 3,
    borderColor: theme.colors.primary.purple,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#e9e9e9",
    
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    backgroundColor: "#e9e9e9",
  },
  nameContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    alignItems: 'center',
    
  },
  avatarName: {
    color: theme.colors.primary.white,
    fontSize: 14,
    fontWeight: 'bold',
  }
});

export default SelectAvatars;
