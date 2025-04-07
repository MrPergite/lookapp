import React, { useState, useEffect, memo } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  onTextChange?: () => void;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 30,
  onComplete,
  onTextChange
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const cursorOpacity = useSharedValue(1);

  useEffect(() => {
    setDisplayedText('');
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        if (text[currentIndex]) {
          setDisplayedText(prev => prev + text[currentIndex]);
          onTextChange?.();
        }
        currentIndex++;
      } else {
        clearInterval(interval);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  // Animate cursor
  useEffect(() => {
    cursorOpacity.value = withTiming(0, { duration: 500 }, () => {
      cursorOpacity.value = withTiming(1, { duration: 500 });
    });
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ fontSize: 16, color: '#000' }}>{displayedText}</Text>
    </View>
  );
};

export default memo(TypewriterText, (prevProps, nextProps) => {
  return prevProps.text === nextProps.text;
}); 