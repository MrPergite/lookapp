import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Dimensions,
  ScrollView
} from 'react-native';
import theme from '@/styles/theme';
import { AVATARS } from '@/constants';
import { useOnBoarding } from '../context';

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

  // Only show the first 4 avatars (2x2 grid) as in the image
  const displayAvatars = AVATARS;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.gridContainer}>
        {displayAvatars.map((avatar) => (
          <TouchableOpacity 
            key={avatar.id}
            style={[
              styles.avatarCard,
              selectedAvatar === avatar.src && styles.selectedAvatarCard
            ]}
            onPress={() => handleSelection(avatar)}
            activeOpacity={0.9}
          >
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: avatar.src }} 
                style={styles.avatarImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.nameContainer}>
              <Text style={styles.avatarName}>{avatar.name}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    paddingTop: 10
  },
  gridContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 16
  },
  avatarCard: {
    width: width * 0.425,
    height: width * 0.55,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: "#e9e9e9",
    marginBottom: 16,
    position: 'relative',
    borderWidth: 3,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  avatarName: {
    color: theme.colors.primary.white,
    fontSize: 24,
    fontWeight: 'bold',
  }
});

export default SelectAvatars;
