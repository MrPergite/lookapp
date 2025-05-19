import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import usePostHog from '../common/hooks/postHog';

export const GenderSelector = ({ selectedGender, setSelectedGender, darkMode }: { selectedGender: string, setSelectedGender: (gender: string) => void, darkMode: boolean }) => {
//   const { trackEvent } = usePostHog();

  const handleSelect = async (gender: string) => {
    setSelectedGender(gender);
    // trackEvent('handle_Gender_Selection', {
    //   button: 'Gender Toggle',
    //   event: 'Click',
    //   state: gender,
    // });
    try {
      await AsyncStorage.setItem('selectedGender', gender);
    } catch (e) {
      console.error('Error saving gender', e);
    }
  };

  const containerBg =  'rgba(229, 231, 235, 0.5)';

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]}>
      {['male', 'female'].map((gender, idx) => {
        const isSelected = selectedGender === gender;
        const gradientColors =
          gender === 'male'
            ? ['#3B82F6', '#2563EB']      // from-blue-500 to-blue-600
            : ['#D946EF', '#EC4899'];     // from-pink-700 to-pink-500
        const textColor = isSelected
          ? '#FFF'
          : darkMode
          ? '#9CA3AF'   // gray-400
          : '#4B5563';  // gray-600

        return (
          <Pressable
            key={gender}
            onPress={() => handleSelect(gender)}
            style={({ pressed }) => [
              styles.buttonBase,
              { marginLeft: idx === 0 ? 0 : 6 },
              { transform: [{ scale: pressed ? 0.95 : 1 }] },
              isSelected && styles.buttonShadow,
            ]}
            accessibilityLabel={`Select ${gender}`}
          >
            {isSelected ? (
              <View style={[styles.gradient, { backgroundColor: gender === 'male' ? '#2563EB' : '#EC4899' }]}>
                <Text style={[styles.buttonText, { color: textColor }]}>
                  {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </Text>
              </View>
            ) : (
              <Text style={[styles.buttonText, { color: textColor }]}>
                {gender.charAt(0).toUpperCase() + gender.slice(1)}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,            // p-1
    borderRadius: 9999, 
 
      // rounded-full
  },
  buttonBase: {
    paddingVertical: 4,    // py-1
    paddingHorizontal: 10, // px-2.5
    borderRadius: 9999,
    overflow: 'hidden',
    paddingLeft:10,
    paddingRight:10,
  },
  gradient: {
    paddingVertical: 4,
     paddingHorizontal: 10,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  
  
  },
  buttonText: {
    fontSize: 12,          // text-xs
    fontWeight: '500',  
    paddingLeft:10,
    paddingRight:10,   // font-medium
  },
  buttonShadow: {
    // approximate shadow-sm
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
});
