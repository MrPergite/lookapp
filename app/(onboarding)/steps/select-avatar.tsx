import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import theme from '@/styles/theme';
import { AVATARS } from '@/constants';
import { useOnBoarding } from '../context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, AnimatePresence } from 'moti';

const { width } = Dimensions.get('window');

// Define the Avatar type
interface Avatar {
  id: string;
  name: string;
  src: string;
  gender: string;
}

interface SelectAvatarsProps {
  goToNextStep: () => void;
}

function SelectAvatars({ goToNextStep }: SelectAvatarsProps) {
  const { payload, dispatch } = useOnBoarding();
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(payload.pref_avatar_url);

  const handleSelection = (avatar: Avatar) => {
    setSelectedAvatar(avatar.src);

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

  const displayAvatars = AVATARS;

  return (
    <ScrollView
      style={{ flex: 1, width: '100%' }}
      contentContainerStyle={{
        ...styles.gridContainer,
        paddingBottom: 200, // Ensure enough space at the bottom for scrolling
      }}
      showsVerticalScrollIndicator={true}
      persistentScrollbar={true}
      alwaysBounceVertical={true}
    >
      <AnimatePresence>
        {displayAvatars.map((avatar, index) => (
          <MotiView
            key={avatar.id}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: 'timing',
              duration: 300,
              delay: index * 100, // Staggered entrance
            }}
            exit={{ opacity: 0, translateY: -20 }}
          >
            <TouchableOpacity
              style={[
                styles.avatarCard,
                selectedAvatar === avatar.src && styles.selectedAvatarCard
              ]}
              onPress={() => handleSelection(avatar)}
              activeOpacity={0.9}
            >
              <MotiView
                animate={{
                  scale: selectedAvatar === avatar.src ? 1.2 : 1,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 15,
                }}
                style={styles.imageContainer}
              >
                <Image
                  source={{ uri: avatar.src }}
                  style={styles.avatarImage}
                  contentFit='cover'
                  contentPosition={'top'}
                  transition={100}
                />
              </MotiView>
              <LinearGradient
                colors={['rgba(0,0,0,0.6)', 'transparent']}
                start={{ x: 0.5, y: 1 }}
                end={{ x: 0.5, y: 0 }}
                style={styles.nameContainer}>
                <Text style={styles.avatarName}>{avatar.name}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </MotiView>
        ))}
      </AnimatePresence>
      {/* Add extra space at the bottom for the Next button */}
      <View style={{ height: 200 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 16,
    paddingTop: 10,
    paddingBottom: 40,
    width: '100%',
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
