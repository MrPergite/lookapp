import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
  Platform,
  Animated,
  Easing,
  Dimensions,
  Image,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import {
  Mail as MailIcon,
  Check as CheckIcon,
  Search,
  Shield,
  Eye,
  EyeOff,
  ChevronRight,
  Shirt,
  ShoppingBag,
  Layers,
  FileStack
} from 'lucide-react-native';
import theme from '@/styles/theme';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useUser } from '@clerk/clerk-expo';
import { useApi } from '@/client-api';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface DigitalWardrobeProps {
  goToNextStep: (data?: any) => void;
}

// Configure Google Sign-In once at app startup
GoogleSignin.configure({
  iosClientId: '1076814890978-qeo79m8tsgg5f90mcdsej2r2pccbs9qb.apps.googleusercontent.com',
  scopes: ['email', 'profile', 'https://www.googleapis.com/auth/gmail.readonly'],
});

// Benefit items with icons
const benefitItems = [
  { text: 'Smart outfit suggestions with your clothes', icon: Shirt },
  { text: 'Personalised shopping recommendations', icon: ShoppingBag },
  { text: 'Mix & match with virtual try-on', icon: Layers },
  { text: 'Effortless style organisation', icon: FileStack },
];

const DigitalWardrobe: React.FC<DigitalWardrobeProps> = ({ goToNextStep }) => {
  const { user } = useUser();
  const [emailConnected, setEmailConnected] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSearchInProgress, setIsSearchInProgress] = useState(false);
  const { callProtectedEndpoint } = useApi();
  const navigation = useNavigation();
  
  // Animation values
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonPulse = useRef(new Animated.Value(1)).current;
  const illustrationOpacity = useRef(new Animated.Value(0)).current;
  const illustrationScale = useRef(new Animated.Value(0.9)).current;

  // Button pulse animation
  useEffect(() => {
    const pulsate = Animated.sequence([
      Animated.timing(buttonPulse, {
        toValue: 1.05,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(buttonPulse, {
        toValue: 1,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    ]);
    
    Animated.loop(pulsate, { iterations: -1 }).start();
  }, []);

  // Animation for button press
  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Run entrance animations
  useEffect(() => {
    // Sequential animations
    Animated.sequence([
      // Illustration first
      Animated.parallel([
        Animated.timing(illustrationOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(illustrationScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ])
    ]).start();
  }, []);

  const handleGoogleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAuthError(null);
    setIsAuthenticating(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
       
      // The following is a workaround for the type issues - adjust according to your GoogleSignin version
      // @ts-ignore - ignoring type checking for Google Sign In data structure
      const userData = userInfo.user || {};
      const email = userData.email || '';
      setEmailConnected(email);

      // Build payload
      const digitalWardrobe = {
        connected: true,
        provider: 'gmail',
        email,
        // @ts-ignore - ignoring type checking for Google Sign In data structure
        idToken: userInfo.idToken || '',
        accessToken: '',
        connectedAt: new Date().toISOString(),
        message: 'Successfully registered for digital wardrobe',
      };

      // Register on backend
      setIsSearchInProgress(true);
      await callProtectedEndpoint('registerDigitalWardrobe', {
        method: 'POST',
        data: { userEmail: email },
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsSearchInProgress(false);
      setModalVisible(false);
      goToNextStep({ digitalWardrobe, message: digitalWardrobe.message });
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        setAuthError('User cancelled the login flow');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        setAuthError('Sign in is in progress already');
      } else {
        setAuthError('An error occurred during Google Sign-In');
        console.error(error);
      }
    } finally {
      setIsAuthenticating(false);
    }
  };
  
  const handleSkipPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    goToNextStep();
  };

  // Add haptic feedback when scanning wardrobe
  const handleScanPress = () => {
    // Add medium haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Existing scan logic...
  };

  // Add haptic feedback for skip action
  const handleSkip = () => {
    // Add light haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Skip logic...
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Background pattern */}
      <View style={styles.patternContainer}>
        {[...Array(20)].map((_, i) => (
          <View 
            key={i} 
            style={[
              styles.patternItem, 
              { 
                left: Math.random() * width, 
                top: Math.random() * 800,
                opacity: 0.04 + (Math.random() * 0.06), // Between 0.04 and 0.1
                transform: [{ rotate: `${Math.random() * 360}deg` }]
              }
            ]} 
          />
        ))}
      </View>
      
      <LinearGradient
        colors={['#ffffff', '#f5f3ff', '#f0f9ff']}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          {/* Wardrobe illustration */}
        
          
          <View 
            style={styles.card}
          >
            <View style={styles.cardInnerShadow} />
            <LinearGradient
              colors={['rgba(255,255,255,0.8)', 'rgba(250,250,255,0.9)']}
              style={styles.cardGradient}
            >
              <MaskedView
                maskElement={
                  <Text style={styles.cardTitleText}>
                    What you'll get:
                  </Text>
                }
              >
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899', '#3B82F6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ height: 24 }}
                />
              </MaskedView>
              
              {benefitItems.map((benefit, i) => {
                const Icon = benefit.icon;
                return (
                  <View 
                    key={i} 
                    style={styles.benefitRow}
                  >
                    <View style={styles.benefitIconContainer}>
                      <Icon size={16} color={theme.colors.primary.purple as string} />
                    </View>
                    <Text style={styles.benefitText}>{benefit.text}</Text>
                  </View>
                );
              })}
            </LinearGradient>
          </View>

          {emailConnected && (
            <View 
              style={styles.connectedBanner}
            >
              {isSearchInProgress ? (
                <Search size={20} color={theme.colors.primary.purple as string} />
              ) : (
                <CheckIcon size={20} color={theme.colors.primary.green as string} />
              )}
              <Text style={styles.connectedText}>{emailConnected}</Text>
            </View>
          )}

          <Animated.View 
            style={{ 
              transform: [
                { scale: buttonScale },
                { scale: buttonPulse }
              ], 
              width: '100%', 
              alignItems: 'center' 
            }}
          >
            <Pressable 
              style={styles.buttonWrapper} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setModalVisible(true);
              }}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
            >
              <LinearGradient
                colors={['#8B5CF6', '#EC4899', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <View style={styles.googleIconContainer}>
                  <Text style={styles.googleIcon}>G</Text>
                </View>
                <Text style={styles.primaryButtonText}>
                  {emailConnected ? 'Connect another account' : 'Continue with Google'}
                </Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          <View style={{ width: '100%', alignItems: 'center', marginTop: 24 }}>
            <Pressable 
              style={styles.skipButton} 
              onPress={handleSkipPress}
              android_ripple={{ color: 'rgba(139,92,246,0.1)' }}
            >
              <Text style={styles.skipButtonText}>
                Skip for now
              </Text>
              <ChevronRight size={16} color="#8B5CF6" style={{ marginLeft: 4 }} />
            </Pressable>
          </View>
          
          <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
            <Animated.View 
              style={styles.modalOverlay}
            >
              <Animated.View 
                style={[
                  styles.modalContent,
                  { transform: [{ translateY: modalVisible ? 0 : 50 }] }
                ]}
              >
                <MaskedView
                  style={{ width: '100%', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }} 
                  maskElement={
                    <View style={{ alignItems: 'center', width: '100%' }}>
                      <Text style={[styles.modalTitle, { color: 'black' }]}>
                        Connect Gmail to Your Wardrobe
                      </Text>
                    </View>
                  }
                >
                  <LinearGradient
                    colors={['#8B5CF6', '#EC4899', '#3B82F6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ height: 30, width: '100%' }}
                  />
                </MaskedView>
                <Pressable 
                  style={styles.privacyBox}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowPrivacy(!showPrivacy);
                  }}
                >
                  <View style={styles.privacyHeader}>
                    <Shield size={20} color={theme.colors.primary.purple as string} />
                    <Text style={[styles.privacyHeaderText, { flex: 1 }]}>Your Privacy is Protected</Text>
                    {showPrivacy ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
                  </View>
                  {showPrivacy && (
                    <Animated.View 
                      style={styles.privacyDetails}
                    >
                      <Text style={styles.privacyDetail}>• We only scan for shopping receipts</Text>
                      <Text style={styles.privacyDetail}>• We never read personal emails</Text>
                      <Text style={styles.privacyDetail}>• You can disconnect any time</Text>
                    </Animated.View>
                  )}
                </Pressable>

                {authError && (
                  <Animated.Text 
                    style={styles.errorText}
                  >
                    {authError}
                  </Animated.Text>
                )}

                <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%', alignItems: 'center' }}>
                  <Pressable
                    style={styles.buttonWrapper}
                    onPress={handleGoogleSignIn}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={isAuthenticating}
                    android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                  >
                    {isAuthenticating ? (
                      <View style={styles.loadingButton}>
                        <ActivityIndicator color="#fff" />
                      </View>
                    ) : (
                      <LinearGradient
                        colors={['#8B5CF6', '#EC4899', '#3B82F6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                      >
                        <View style={styles.googleIconContainer}>
                          <Text style={styles.googleIcon}>G</Text>
                        </View>
                        <Text style={styles.primaryButtonText}>Continue with Google</Text>
                      </LinearGradient>
                    )}
                  </Pressable>
                </Animated.View>

                <View style={{ width: '100%', alignItems: 'center', marginTop: 24 }}>
                  <Pressable 
                    style={styles.cancelButton}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setModalVisible(false);
                    }} 
                    disabled={isAuthenticating}
                    android_ripple={{ color: 'rgba(139,92,246,0.1)' }}
                  >
                    <Text style={styles.skipButtonText}>
                      Cancel
                    </Text>
                  </Pressable>
                </View>
              </Animated.View>
            </Animated.View>
          </Modal>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    padding: 24, 
    alignItems: 'center',
    paddingBottom: 50,
  },
  patternContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
  patternItem: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#8B5CF6',
  },
  illustrationContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  illustrationIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary.purple as string,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  card: { 
    width: '100%', 
    borderRadius: 16, 
    marginBottom: 24,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.8)',
    position: 'relative',
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 20,
    borderRadius: 16,
  },
  cardInnerShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
    zIndex: 1,
  },
  cardTitle: { fontWeight: '600', fontSize: 16, marginBottom: 12, color: theme.colors.primary.purple as string },
  cardTitleText: { fontWeight: '700', fontSize: 18 },
  benefitRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12,
    marginTop: 12,
  },
  benefitIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bullet: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: theme.colors.primary.purple as string, 
    marginRight: 12,
    shadowColor: theme.colors.primary.purple as string,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  benefitText: { fontSize: 15, color: '#4B5563', flexShrink: 1, fontWeight: '500' },
  connectedBanner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    backgroundColor: '#DCFCE7', 
    borderColor: '#BBF7D0', 
    borderWidth: 1, 
    borderRadius: 12, 
    marginBottom: 16,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
    width: '100%',
  },
  connectedText: { marginLeft: 8, color: '#16A34A', fontWeight: '500' },
  buttonWrapper: { 
    width: '90%', 
    borderRadius: 30, 
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  gradientButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 16, 
    paddingHorizontal: 24, 
    width: '100%' 
  },
  loadingButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 16, 
    paddingHorizontal: 24, 
    width: '100%', 
    backgroundColor: theme.colors.primary.purple as string, 
    borderRadius: 30
  },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  skipButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  skipButtonText: { 
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24 
  },
  modalContent: { 
    width: '100%', 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 24, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 5,
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    textAlign: 'center',
  },
  privacyBox: { 
    width: '100%', 
    borderWidth: 1, 
    borderColor: '#DBEAFE', 
    backgroundColor: '#EFF6FF', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 24, 
  },
  privacyHeader: { flexDirection: 'row', alignItems: 'center' },
  privacyHeaderText: { fontSize: 15, fontWeight: '600', color: '#1E3A8A', marginLeft: 12 },
  privacyDetails: { marginTop: 12, marginLeft: 32 },
  privacyDetail: { fontSize: 14, color: '#1E40AF', marginBottom: 6 },
  errorText: { color: '#EF4444', marginVertical: 12, fontWeight: '500' },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  googleIcon: {
    color: '#4285F4',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default DigitalWardrobe;
