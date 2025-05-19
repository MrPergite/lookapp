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
  Search,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import theme from '@/styles/theme';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useUser } from '@clerk/clerk-expo';
import { useApi } from '@/client-api';

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
      await GoogleSignin.hasPlayServices(); // Android only, safe to call
      const userInfo = await GoogleSignin.signIn();
     
      const { user: googleUser, idToken, accessToken } = userInfo?.data;
      const email = googleUser.email;
      setEmailConnected(email);

      // Build payload
      const digitalWardrobe = {
        connected: true,
        provider: 'gmail',
        email,
        idToken,
        accessToken,
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

  const benefits = [
    'Smart outfit suggestions with your clothes',
    'Personalised shopping recommendations',
    'Mix & match with virtual try-on',
    'Effortless style organisation',
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
            <Search size={20} color={theme.colors.primary.purple as string} />
          ) : (
            <CheckIcon size={20} color={theme.colors.primary.green as string} />
          )}
          <Text style={styles.connectedText}>{emailConnected}</Text>
        </View>
      )}

      <Pressable style={styles.primaryButton} onPress={() => setModalVisible(true)}>
        <MailIcon size={18} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.primaryButtonText}>
          {emailConnected ? 'Connect another account' : 'Continue with Google'}
        </Text>
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

            {authError && <Text style={styles.errorText}>{authError}</Text>}

            <Pressable
              style={styles.primaryButton}
              onPress={handleGoogleSignIn}
              disabled={isAuthenticating}
            >
              {isAuthenticating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MailIcon size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryButtonText}>Continue with Google</Text>
                </>
              )}
            </Pressable>

            <Pressable style={styles.skipButton} onPress={() => setModalVisible(false)} disabled={isAuthenticating}>
              <Text style={styles.skipButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, alignItems: 'center' },
  card: { width: '100%', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 16, marginBottom: 24 },
  cardTitle: { fontWeight: '600', fontSize: 16, marginBottom: 12, color: theme.colors.primary.purple as string },
  benefitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.primary.purple as string, marginRight: 8 },
  benefitText: { fontSize: 13, color: '#555', flexShrink: 1 },
  connectedBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#DCFCE7', borderColor: '#BBF7D0', borderWidth: 1, borderRadius: 12, marginBottom: 16 },
  connectedText: { marginLeft: 8, color: '#16A34A', fontWeight: '500' },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary.purple as string, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 8, minWidth: '80%' },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  skipButton: { marginTop: 16 },
  skipButtonText: { color: theme.colors.secondary.darkGray as string, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  privacyBox: { width: '100%', borderWidth: 1, borderColor: '#DBEAFE', backgroundColor: '#EFF6FF', borderRadius: 10, padding: 12, marginBottom: 20 },
  privacyHeader: { flexDirection: 'row', alignItems: 'center' },
  privacyHeaderText: { fontSize: 14, fontWeight: '500', color: '#1E3A8A' },
  privacyDetails: { marginTop: 10, marginLeft: 24 },
  privacyDetail: { fontSize: 12, color: '#1E40AF', marginBottom: 4 },
  errorText: { color: 'red', marginVertical: 12 },
});

export default DigitalWardrobe;
