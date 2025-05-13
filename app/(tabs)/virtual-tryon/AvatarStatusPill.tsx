import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, RefreshCw, Loader as Loader } from 'lucide-react-native';
import theme from '@/styles/theme';

export type AvatarStatus = 'ready' | 'processing' | 'pending' | 'failed' | string | null | undefined;

interface AvatarStatusPillProps {
  avatarStatus: AvatarStatus;
  avatarCreationProgress?: number;
  onShowMyAvatars?: () => void;
  onRecreateAvatar?: () => void;
}

const AvatarStatusPill: React.FC<AvatarStatusPillProps> = ({
  avatarStatus,
  avatarCreationProgress = 0,
  onShowMyAvatars,
  onRecreateAvatar,
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const animatedProgressWidth = useRef(new Animated.Value(0)).current;

  // Debug log (optional)
  // console.log('AvatarStatusPill avatarStatus:', avatarStatus);

  // Mapping of backend status → UI label + default progress value (declared before useMemo to avoid TDZ)
  const statusMapping: Record<string, { message: string; progress: number }> = {
    pending: { message: 'Model Training', progress: 25 },
    available: { message: 'In Progress', progress: 50 },
    generating: { message: 'Creating Images', progress: 75 },
    ready: { message: 'Avatar Ready', progress: 100 },
    failed: { message: 'Generation Failed', progress: 100 },
  };

  // Base status object derived from mapping (message + default progress)
  const baseStatus = useMemo(() => {
    return (
      statusMapping[avatarStatus as keyof typeof statusMapping] || {
        message: 'Creating Avatar',
        progress: 25,
      }
    );
  }, [avatarStatus, statusMapping]);

  // Decide which progress value to show: explicit prop or mapping default
  const effectiveProgress =  baseStatus.progress;

  useEffect(() => {
    if (avatarStatus) {
      rotateAnim.setValue(0);
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.stopAnimation?.();
      rotateAnim.setValue(0);
    }
    return () => rotateAnim.stopAnimation?.();
  }, [avatarStatus, rotateAnim]);

  useEffect(() => {
    Animated.timing(animatedProgressWidth, {
      toValue: effectiveProgress,
      duration: 300,
      useNativeDriver: false, // Width animation
    }).start();
  }, [effectiveProgress, animatedProgressWidth]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Helper to fetch a safe status object
  const getBaseStatus = () => baseStatus;

  // Determine UI specifics based on avatarStatus
  const getStatusInfo = () => {
    if (avatarStatus === 'failed') {
      return {
        message: 'Recreate Avatar',
        icon: <RefreshCw size={16} color="#DC2626" />,
        action: onRecreateAvatar,
        gradientColors: ['#fffbeb', '#fee2e2'] as [string, string],
        textColor: '#B91C1C',
        showProgress: false,
      } as const;
    }

    if (avatarStatus === 'ready' || avatarStatus === 'completed') {
      return {
        message: 'My Avatars',
        icon: <Sparkles size={16} color={theme.colors.primary.purple || '#9333EA'} />,
        action: onShowMyAvatars,
        gradientColors: ['#f3e8ff', '#fce7f3'] as [string, string],
        textColor: theme.colors.primary.purple || '#7E22CE',
        showProgress: false,
      } as const;
    }

    // Default / in-progress states (pending, processing, etc.)
    const baseStatus = getBaseStatus();
    return {
      message: baseStatus.message,
      icon: (
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Loader size={20} color={theme.colors.primary.purple || '#9333EA'} />
        </Animated.View>
      ),
      action: undefined,
      gradientColors: ['#f3e8ff', '#fce7f3'] as [string, string],
      textColor: theme.colors.primary.purple || '#7E22CE',
      showProgress: true,
    } as const;
  };

  const statusInfo = getStatusInfo();

  if (!statusInfo) {
    return null;
  }

  const PillContent = (
    <View style={styles.pillInnerContent}>
      {statusInfo.icon}
      <View style={styles.textAndProgressContainer}>
        <Text style={[styles.pillText, { color: statusInfo.textColor }]}>
          {statusInfo.message}
        </Text>
        {statusInfo.showProgress && (
          <View style={styles.progressBarTrack}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: animatedProgressWidth.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
            
          </View>
        )}
      </View>
    </View>
  );

  return (
    <TouchableOpacity onPress={statusInfo.action} disabled={!statusInfo.action} activeOpacity={0.7}>
      <LinearGradient 
        colors={statusInfo.gradientColors as [string, string, ...string[]]}
        style={styles.pillContainer}
      >
        {PillContent}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pillContainer: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,  
    height: 40, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  pillInnerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, 
  },
  textAndProgressContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4, 
  },
  pillText: {
    fontSize: 14, 
    fontWeight: '500', 
  },
  progressBarTrack: {
    width: '100%',
    height: 6, 
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: theme.colors.primary.purple, 
  },
});

export default AvatarStatusPill; 