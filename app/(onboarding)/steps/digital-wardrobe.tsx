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
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import {
  Mail as MailIcon,
  Check as CheckIcon,
  Search,
  Shield,
  Eye,
  EyeOff,
  ArrowRight,
  ChevronRight
} from 'lucide-react-native';
import theme from '@/styles/theme';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useUser } from '@clerk/clerk-expo';
import { useApi } from '@/client-api';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

interface DigitalWardrobeProps {
  goToNextStep: (data?: any) => void;
}

// Configure Google Sign-In once at app startup
GoogleSignin.configure({
  iosClientId: '1076814890978-qeo79m8tsgg5f90mcdsej2r2pccbs9qb.apps.googleusercontent.com',
  scopes: ['email', 'profile', 'https://www.googleapis.com/auth/gmail.readonly'],
});

const DigitalWardrobe: React.FC<DigitalWardrobeProps> = ({ goToNextStep }) => {
  const { user } = useUser();
  const [emailConnected, setEmailConnected] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSearchInProgress, setIsSearchInProgress] = useState(false);
  const { callProtectedEndpoint } = useApi();

  // Define benefits list first
  const benefits = [
    'Smart outfit suggestions with your clothes',
    'Personalised shopping recommendations',
    'Mix & match with virtual try-on',
    'Effortless style organisation',
  ];

  // Animation values
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(50)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const benefitAnimations = useRef(benefits.map(() => new Animated.Value(0))).current;

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
    // Card animation
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    ]).start();

    // Staggered benefit animations
    Animated.stagger(
      100,
      benefitAnimations.map(anim =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      )
    ).start();
  }, []);

  // useEffect(() => {
  //   const storedEmail = user?.emailAddresses[0]?.emailAddress;
  //   if (storedEmail) {
  //     setEmailConnected(storedEmail);
  //   }
  // }, [user]);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsAuthenticating(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
     
      const { user: googleUser, idToken, accessToken } = userInfo?.data;
      const email = googleUser.email;
      setEmailConnected(email);

      // Build payload
      const digitalWardrobe = {
        connected: true,
        provider: 'gmail',
        email,
        idToken: userInfo?.idToken || '',
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

      setIsSearchInProgress(false);
      setModalVisible(false);
      goToNextStep({ digitalWardrobe, message: digitalWardrobe.message });
    } catch (error: any) {
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animated.View 
        style={[
          styles.card, 
          { 
            opacity: cardOpacity,
            transform: [{ translateY: cardTranslateY }]
          }
        ]}
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
        {benefits.map((b, i) => (
          <Animated.View 
            key={i} 
            style={[
              styles.benefitRow,
              { opacity: benefitAnimations[i], transform: [{ translateX: benefitAnimations[i].interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              })}] }
            ]}
          >
            <View style={styles.bullet} />
            <Text style={styles.benefitText}>{b}</Text>
          </Animated.View>
        ))}
      </Animated.View>

      {emailConnected && (
        <Animated.View 
          style={[
            styles.connectedBanner,
            { opacity: cardOpacity }
          ]}
        >
          {isSearchInProgress ? (
            <Search size={20} color={theme.colors.primary.purple as string} />
          ) : (
            <CheckIcon size={20} color={theme.colors.primary.green as string} />
          )}
          <Text style={styles.connectedText}>{emailConnected}</Text>
        </Animated.View>
      )}

      <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%', alignItems: 'center' }}>
        <Pressable 
          style={styles.buttonWrapper} 
          onPress={() => setModalVisible(true)}
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
            <MailIcon size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>
              {emailConnected ? 'Connect another account' : 'Continue with Google'}
            </Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      <View style={{ width: '100%', alignItems: 'center', marginTop: 24 }}>
        <Pressable 
          style={styles.skipButton} 
          onPress={() => goToNextStep()}
          android_ripple={{ color: 'rgba(139,92,246,0.1)' }}
        >
          <Text style={[styles.skipButtonText, { color: '#8B5CF6' }]}>
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
              onPress={() => setShowPrivacy(!showPrivacy)}
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
                    <MailIcon size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryButtonText}>Continue with Google</Text>
                  </LinearGradient>
                )}
              </Pressable>
            </Animated.View>

            <View style={{ width: '100%', alignItems: 'center', marginTop: 24 }}>
              <Pressable 
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)} 
                disabled={isAuthenticating}
                android_ripple={{ color: 'rgba(139,92,246,0.1)' }}
              >
                <Text style={[styles.skipButtonText, { color: '#8B5CF6' }]}>
                  Cancel
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, alignItems: 'center' },
  card: { 
    width: '100%', 
    backgroundColor: 'rgba(255,255,255,0.8)', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  cardTitle: { fontWeight: '600', fontSize: 16, marginBottom: 12, color: theme.colors.primary.purple as string },
  cardTitleText: { fontWeight: '600', fontSize: 16, marginBottom:0 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  bullet: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    backgroundColor: theme.colors.primary.purple as string, 
    marginRight: 8,
    shadowColor: theme.colors.primary.purple as string,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  benefitText: { fontSize: 13, color: '#555', flexShrink: 1 },
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
  },
  connectedText: { marginLeft: 8, color: '#16A34A', fontWeight: '500' },
  buttonWrapper: { 
    width: '80%', 
    borderRadius: 8, 
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  gradientButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 14, 
    paddingHorizontal: 20, 
    width: '100%' 
  },
  loadingButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 14, 
    paddingHorizontal: 20, 
    width: '100%', 
    backgroundColor: theme.colors.primary.purple as string, 
    borderRadius: 8 
  },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  skipButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  skipButtonText: { 
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
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
    borderRadius: 12, 
    padding: 20, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    textAlign: 'center',
  },
  privacyBox: { 
    width: '100%', 
    borderWidth: 1, 
    borderColor: '#DBEAFE', 
    backgroundColor: '#EFF6FF', 
    borderRadius: 10, 
    padding: 12, 
    marginBottom: 20, 
  },
  privacyHeader: { flexDirection: 'row', alignItems: 'center' },
  privacyHeaderText: { fontSize: 14, fontWeight: '500', color: '#1E3A8A', marginLeft: 12 },
  privacyDetails: { marginTop: 10, marginLeft: 24 },
  privacyDetail: { fontSize: 12, color: '#1E40AF', marginBottom: 4 },
  errorText: { color: 'red', marginVertical: 12 },
  cancelButton: {
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DigitalWardrobe;
