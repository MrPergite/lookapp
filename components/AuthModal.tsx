import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { ThemedText } from './ThemedText';
import theme from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { Circle, CircleX, Cross, ShoppingBag, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AuthModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSignIn?: () => void;
  onSignUp?: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isVisible,
  onClose,
  onSignIn,
  onSignUp
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={theme.colors.secondary.darkGray} />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <ShoppingBag
              size={48}
              color={theme.colors.primary.purple}
              style={styles.icon}
            />
          </View>


          <ThemedText type="title" style={styles.title}>
            Save Your Discoveries
          </ThemedText>

          <ThemedText type='subtitle' style={styles.subtitle}>
            Create a free account to start building your shopping list
          </ThemedText>

          <TouchableOpacity
            style={styles.createAccountButton}
            onPress={onSignUp}
          >
            <ThemedText style={styles.createAccountButtonText}>
              Create Free Account
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signInButton}
            onPress={onSignIn}
          >
            <ThemedText style={styles.signInButtonText}>
              Sign In
            </ThemedText>
          </TouchableOpacity>

          <View style={styles.benefitsContainer}>
            <View style={styles.benefitRow}>
              <View style={styles.bulletPoint} />
              <ThemedText style={styles.benefitText}>Save items for later</ThemedText>
            </View>

            <View style={styles.benefitRow}>
              <View style={styles.bulletPoint} />
              <ThemedText style={styles.benefitText}>Get personalized recommendations</ThemedText>
            </View>

            <View style={styles.benefitRow}>
              <View style={styles.bulletPoint} />
              <ThemedText style={styles.benefitText}>Access your list from any device</ThemedText>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: Dimensions.get('window').width * 0.9,
    backgroundColor: theme.colors.primary.white,
    borderRadius: 15,
    padding: theme.spacing.lg,
    alignItems: 'center',
    shadowColor: theme.colors.secondary.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
    zIndex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(149, 86, 235, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  icon: {

  },
  title: {
    fontSize: 28,
    fontFamily: 'default-bold',
    marginBottom: theme.spacing.sm,
    color: theme.colors.primary.purple,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.secondary.darkGray,
    textAlign: 'center',
    marginBottom: theme.spacing.xl
  },
  createAccountButton: {
    width: '100%',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    height: 50,
    backgroundColor: theme.colors.primary.purple,
  },
  createAccountButtonText: {
    color: theme.colors.primary.white,
    fontFamily: 'default-semibold',
    fontSize: 16,
  },
  signInButton: {
    width: '100%',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
    height: 50,
    borderWidth: 1,
    borderColor: theme.colors.primary.purple,
  },
  signInButtonText: {
    color: theme.colors.primary.purple,
    fontFamily: 'default-semibold',
    fontSize: 16,
  },
  benefitsContainer: {
    width: '100%',
    alignItems: 'flex-start',
    marginTop: theme.spacing.sm,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  bulletPoint: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary.purple,
    marginRight: theme.spacing.sm,
  },
  benefitText: {
    fontSize: 16,
    color: theme.colors.secondary.darkGray,
  }
});

export default AuthModal; 