import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
  ActivityIndicator
} from 'react-native';
import { X as XIcon, RefreshCw } from 'lucide-react-native';
import theme from '@/styles/theme';
import { ThemedText } from '@/components/ThemedText';
import StyleProfile, { StyleProfileRefHandles } from '../../(onboarding)/steps/style-profile';
import { OnBoardingProvider } from '../../(onboarding)/context';
import Toast from 'react-native-toast-message';
import GradientText from '@/components/GradientText';

interface RecreateAvatarModalProps {
  visible: boolean;
  onClose: () => void;
  onRecreationSuccess: () => void;
}

// Wrapper to provide context and handle callbacks from StyleProfile
const StyleProfileInModal: React.FC<{
  onModalClose: () => void; 
  onRecreationSuccess: () => void;
  styleProfileRef: React.RefObject<StyleProfileRefHandles>;
}> = ({ onModalClose, onRecreationSuccess, styleProfileRef }) => {
  
  const handleStyleProfileNext = (data: any) => {
    console.log('StyleProfile finished in modal, data:', data);
    onRecreationSuccess();
  };

  const handleStyleProfileBack = () => {
    onModalClose();
  };

  return (
    <StyleProfile 
      ref={styleProfileRef}
      onNext={handleStyleProfileNext} 
      onBack={handleStyleProfileBack} 
    />
  );
};

const RecreateAvatarModal: React.FC<RecreateAvatarModalProps> = ({
  visible,
  onClose,
  onRecreationSuccess,
}) => {
  const styleProfileRef = useRef<StyleProfileRefHandles>(null);
  // This local processing state is for the Recreate Avatar button itself
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRecreatePress = async () => {
    console.log('[RecreateModal] handleRecreatePress called.');
    if (styleProfileRef.current && typeof styleProfileRef.current.submitStep === 'function') {
      console.log('[RecreateModal] styleProfileRef.current.submitStep is available. Calling it...');
      setIsSubmitting(true);
      try {
        await styleProfileRef.current.submitStep(); 
        console.log('[RecreateModal] submitStep promise resolved (this means StyleProfile called its onNext).');
      } catch (error) {
        // This catch block in RecreateAvatarModal will only catch errors if submitStep itself throws an unhandled exception
        // OR if the promise returned by submitStep is rejected without StyleProfile handling it internally.
        // StyleProfile's internal try/catch for the API call should handle API errors and show Toasts.
        console.error("[RecreateModal] Error during styleProfileRef.current.submitStep() invocation OR unhandled rejection from submitStep:", error);
        Toast.show({type: 'error', text1: 'Submission Error', text2: 'Could not initiate avatar recreation.'});
      } finally {
        setIsSubmitting(false);
      }
    } else {
      console.error('[RecreateModal] styleProfileRef.current is null or submitStep is not a function.');
      if (styleProfileRef.current) {
          console.log('[RecreateModal] styleProfileRef.current properties:', Object.keys(styleProfileRef.current));
      } else {
          console.log('[RecreateModal] styleProfileRef.current is indeed null.');
      }
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeAreaFullModalContainer}>
        <OnBoardingProvider> 
            <View style={styles.modalHeader}>
                <View style={{width: 40}} /> {/* Spacer to balance close button */}
                <GradientText className='font-semibold' style={styles.modalTitle} gradientColors={['#ec4899', '#a855f7', '#6366f1']} children={'Recreate Avatar'}   />            
                 <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <XIcon size={24} color={theme.colors.text as string} />
                </TouchableOpacity>
            </View>

            <View style={styles.styleProfileWrapper}> 
              <StyleProfileInModal 
                  styleProfileRef={styleProfileRef}
                  onModalClose={onClose} 
                  onRecreationSuccess={onRecreationSuccess} 
              />
            </View>

            <View style={styles.modalFooter}>
                <TouchableOpacity 
                    style={styles.footerButtonOutline} 
                    onPress={onClose}
                    disabled={isSubmitting} // Disable while submitting
                >
                    <ThemedText style={styles.footerButtonText}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.footerButtonFill, isSubmitting && styles.disabledButton]} 
                    onPress={handleRecreatePress}
                    disabled={isSubmitting} // Disable while submitting
                >
                    {isSubmitting ? (
                        <View style={styles.processingContent}>
                            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                            <ThemedText style={styles.footerButtonTextWhite}>Processing…</ThemedText>
                        </View>
                    ) : (
                        <ThemedText style={styles.footerButtonTextWhite}>Recreate Avatar</ThemedText>
                    )}
                </TouchableOpacity>
            </View>
        </OnBoardingProvider>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeAreaFullModalContainer: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing?.md || 16,
    paddingVertical: theme.spacing?.sm || 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.secondary.lightGray as string,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: theme.colors.text as string,
  },
  closeButton: {
    padding: theme.spacing?.xs || 4,
  },
  styleProfileWrapper: {
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: theme.spacing?.md || 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.secondary.lightGray as string,
    backgroundColor: 'white',
  },
  footerButtonOutline: {
    flex: 1,
    paddingVertical: theme.spacing?.sm || 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.secondary.mediumLightGray as string,
    alignItems: 'center',
    marginRight: (theme.spacing?.sm || 8) / 2,
  },
  footerButtonFill: {
    flex: 1,
    paddingVertical: theme.spacing?.sm || 12,
    borderRadius: 8,
    backgroundColor: theme.colors.primary.purple as string,
    alignItems: 'center',
    marginLeft: (theme.spacing?.sm || 8) / 2,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text as string,
  },
  footerButtonTextWhite: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  processingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  }
});

export default RecreateAvatarModal; 