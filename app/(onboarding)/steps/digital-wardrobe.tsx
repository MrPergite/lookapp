import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import {
  Mail as MailIcon,
  Check as CheckIcon,
  RefreshCw,
  Search,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import theme from '@/styles/theme';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useUser } from '@clerk/clerk-expo';
import { useApi } from '@/client-api';

interface DigitalWardrobeProps {
  goToNextStep: (data?: any) => void;
}

const GOOGLE_CLIENT_ID =
  '1076814890978-qeo79m8tsgg5f90mcdsej2r2pccbs9qb.apps.googleusercontent.com';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_SCOPE =
  'email profile https://www.googleapis.com/auth/gmail.readonly';

const DigitalWardrobe: React.FC<DigitalWardrobeProps> = ({ goToNextStep }) => {
  const { user } = useUser();
  const [emailConnected, setEmailConnected] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSearchInProgress, setIsSearchInProgress] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authData, setAuthData] = useState<any>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const { callProtectedEndpoint } = useApi();

  useEffect(() => {
    if (user) {
     
      const storedEmail =user?.emailAddresses[0]?.emailAddress
      if (storedEmail) {
        // setEmailConnected(storedEmail as string);

        const digitalWardrobe = {
          connected: true,
          provider: 'gmail',
          email: storedEmail,
          connectedAt: new Date().toISOString(),
        };

        const digitalRegistration = user.publicMetadata?.digitalRegistration;
        if (digitalRegistration) {
          setIsSearchInProgress(true);
          proceedToNextStep(digitalWardrobe, 'Successfully registered for digital wardrobe');
        }
      }
    }
  }, [user]);



  const handleGmailSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);

    const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });


    const authUrl =
    `${GOOGLE_AUTH_URL}?client_id=${GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code&prompt=consent` +
    `&scope=${encodeURIComponent(GOOGLE_SCOPE)}`;

    try {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      console.log('OAuth Result:', result);

      if (result.type === 'success' && result.url) {
        const params = new URLSearchParams(result.url.split('#')[1]);
        const token = params.get('code');
        const expiresIn = params.get('expires_in');
        const storedEmail =user?.emailAddresses[0]?.emailAddress
        // const email = await fetchGoogleUserEmail(token as string);
        setEmailConnected(storedEmail as string);
        const digitalWardrobe = {
          connected: true,
          provider: 'gmail',
          token,
          refreshToken: null,
          expiresIn,
          emailConnected,
          connectedAt: new Date().toISOString(),
          message: 'Successfully registered for digital wardrobe',
        };

      
        setAuthData(digitalWardrobe);
        setModalVisible(false);

        await registerDigitalWardrobe(digitalWardrobe);
        proceedToNextStep(digitalWardrobe, digitalWardrobe.message);
      } else {
        console.log('OAuth cancelled or failed');
        setAuthError('Authentication was cancelled or failed. Please try again.');
      }
    } catch (error) {
      console.error('OAuth error:', error);
      setAuthError('Authentication error occurred.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const registerDigitalWardrobe = async (data: any) => {
    try {
      setIsRegistering(true);
      setIsSearchInProgress(true);
      const storedEmail =user?.emailAddresses[0]?.emailAddress
      console.log('emailConnected', emailConnected);
      // Send to backend via protected endpoint
      await callProtectedEndpoint('registerDigitalWardrobe', {
        method: 'POST',
        data: { userEmail: storedEmail},
      });
      console.log('Digital wardrobe registered');
    } catch (err) {
      console.error('Error registering digital wardrobe:', err);
      setAuthError('Failed to register digital wardrobe.');
      setIsSearchInProgress(false);
    } finally {
      setIsRegistering(false);
    }
  };

  const proceedToNextStep = (data: any, message: string) => {
    goToNextStep({
      digitalWardrobe: data,
      message,
    });
  };

  const benefits = [
    'Smart outfit suggestions with your clothes',
    'Personalised shopping recommendations',
    'Mix & match with virtual try-on',
    'Effortless style organisation',
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* <ThemedText style={styles.title}>Discover Your Digital Wardrobe</ThemedText> */}
      <ThemedText style={styles.subtitle}>
      
      </ThemedText>

      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>What you'll get:</ThemedText>
        {benefits.map((b, i) => (
          <View key={i} style={styles.benefitRow}>
            <View style={styles.bullet} />
            <Text style={styles.benefitText}>{b}</Text>
          </View>
        ))}
      </View>

      {emailConnected && (
        <View style={styles.connectedBanner}>
          {isSearchInProgress ? (
            <Search size={20} color={theme.colors.primary.purple as string} style={{ marginRight: 6 }} />
          ) : (
            <CheckIcon size={20} color={theme.colors.primary.green as string} style={{ marginRight: 6 }} />
          )}
          <Text style={styles.connectedText}>{emailConnected}</Text>
        </View>
      )}

      <Pressable style={styles.primaryButton} onPress={() => setModalVisible(true)}>
        {isAuthenticating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <MailIcon size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>
              {emailConnected ? 'Connect another account' : 'Continue with Google'}
            </Text>
          </>
        )}
      </Pressable>

      <Pressable style={styles.skipButton} onPress={() => goToNextStep()}>
        <Text style={styles.skipButtonText}>Skip for now</Text>
      </Pressable>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Connect Gmail to Your Wardrobe</ThemedText>

            <View style={styles.privacyBox}>
              <Pressable style={styles.privacyHeader} onPress={() => setShowPrivacy(!showPrivacy)}>
                <Shield size={20} color={theme.colors.primary.purple as string} />
                <Text style={[styles.privacyHeaderText, { flex: 1 }]}>Your Privacy is Protected</Text>
                {showPrivacy ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
              </Pressable>

              {showPrivacy && (
                <View style={styles.privacyDetails}>
                  <Text style={styles.privacyDetail}>• We only scan for shopping receipts</Text>
                  <Text style={styles.privacyDetail}>• We never read personal emails</Text>
                  <Text style={styles.privacyDetail}>• You can disconnect any time</Text>
                </View>
              )}
            </View>

            {authError && (
              <Text style={{ color: 'red', marginBottom: 12 }}>{authError}</Text>
            )}

            {isAuthenticating ? (
              <ActivityIndicator size="large" color={theme.colors.primary.purple as string} />
            ) : (
              <Pressable style={styles.primaryButton} onPress={handleGmailSignIn}>
                <MailIcon size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryButtonText}>Continue with Google</Text>
              </Pressable>
            )}

            <Pressable style={styles.skipButton} disabled={isAuthenticating} onPress={() => setModalVisible(false)}>
              <Text style={styles.skipButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default DigitalWardrobe;


const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.primary.purple as string,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.secondary.darkGray as string,
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  cardTitle: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 12,
    color: theme.colors.primary.purple as string,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary.purple as string,
    marginRight: 8,
  },
  benefitText: {
    fontSize: 13,
    color: '#555',
    flexShrink: 1,
  },
  connectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
  },
  connectedText: {
    marginLeft: 8,
    color: '#16A34A',
    fontWeight: '500',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary.purple as string,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: '80%',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  skipButton: {
    marginTop: 16,
  },
  skipButtonText: {
    color: theme.colors.secondary.darkGray as string,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
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
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyHeaderText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E3A8A',
  },
  privacyDetails: {
    marginTop: 10,
    marginLeft: 24,
  },
  privacyDetail: {
    fontSize: 12,
    color: '#1E40AF',
    marginBottom: 4,
  },
}); 