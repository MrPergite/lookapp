import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

export const AboutEcoAIDialog = ({ darkMode=true }) => {
  const [visible, setVisible] = useState(false);

  // Colors matching Tailwind’s gray-300/600/100/900
  const triggerColor = darkMode ? '#D1D5DB' : '#4B5563';
  const backgroundColor = darkMode ? '#1F1F1F' : '#FFFFFF';
  const titleColor = darkMode ? '#F3F4F6' : '#111827';
  const descColor = darkMode ? '#D1D5DB' : '#4B5563';

  const items = [
    'Ask about products or styles',
    'Get personalized recommendations',
    'Upload images for visual search',
    'Find items from TikTok and Instagram posts',
  ];

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={styles.trigger}
      >
        <Feather name="info" size={20} color={triggerColor} />
      </TouchableOpacity>

      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={[styles.dialog, { backgroundColor }]}>
            <Text style={[styles.title, { color: titleColor }]}>
              About Look AI
            </Text>
            <Text style={[styles.description, { color: descColor }]}>
              Look AI is your AI-powered shopping assistant. Here's what you can do:
            </Text>
            <View style={styles.list}>
              {items.map((item) => (
                <View style={styles.listItem} key={item}>
                  <Text style={[styles.bullet, { color: descColor }]}>
                    {'\u2022'}
                  </Text>
                  <Text style={[styles.listText, { color: descColor }]}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DIALOG_WIDTH = Math.min(325, SCREEN_WIDTH * 0.9);

const styles = StyleSheet.create({
  trigger: {
    padding: 8,
    borderRadius: 24,
    alignSelf: 'flex-start',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialog: {
    width: DIALOG_WIDTH,
    borderRadius: 8,
    padding: 16,
  },
  title: {
    fontSize: 18,           // roughly Tailwind text-lg
    fontWeight: '600',      // semibold
    marginBottom: 8,
  },
  description: {
    fontSize: 16,           // default base
    lineHeight: 24,
  },
  list: {
    marginTop: 8,           // Tailwind mt-2
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,           // Tailwind space-y-1
  },
  bullet: {
    fontSize: 16,
    lineHeight: 24,
    marginRight: 8,
  },
  listText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
});
