import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Modal } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X as XIcon } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import theme from '@/styles/theme'; // Assuming this path is correct relative to this new file

// If Button and ThemedText are used within CameraCapture and are app-wide components,
// they should be imported from their respective locations.
// For this example, I'll create simple stubs or use basic RN components if not complex.
const Button: React.FC<{ title: string, onPress: () => void, disabled?: boolean, style?: any }> = ({ title, onPress, disabled, style }) => (
    <Pressable onPress={onPress} disabled={disabled} style={[cameraCaptureStyles.genericButton, style, disabled && cameraCaptureStyles.disabledButton]}>
        <Text style={cameraCaptureStyles.genericButtonText}>{title}</Text>
    </Pressable>
);

interface CameraCaptureProps {
  visible: boolean;
  onCapturePhoto: (photo: { uri: string; type: string; name: string }) => void;
  onCancel: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ visible, onCapturePhoto, onCancel }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible, permission, requestPermission]);

  const handleTakePicture = async () => {
    if (!cameraRef.current || !isCameraReady) {
      Toast.show({ type: 'error', text1: 'Camera not ready' });
      return;
    }
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
      });
      if (photo && photo.uri) {
        const fileName = photo.uri.split('/').pop() || `capture-${Date.now()}.jpg`;
        onCapturePhoto({ uri: photo.uri, type: 'image/jpeg', name: fileName });
      } else {
        Toast.show({ type: 'error', text1: 'Failed to capture image' });
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Toast.show({ type: 'error', text1: 'Error taking picture' });
    }
  };

  if (!visible) {
    return null;
  }

  if (!permission) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onCancel} transparent={true}>
        <View style={cameraCaptureStyles.modalOverlay}>
          <View style={cameraCaptureStyles.modalContentContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.purple} />
            <Text style={cameraCaptureStyles.infoText}>Requesting camera permission...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onCancel} transparent={true}>
        <View style={cameraCaptureStyles.modalOverlay}>
          <View style={cameraCaptureStyles.modalContentContainerPadded}>
            <Text style={cameraCaptureStyles.titleText}>Camera Permission</Text>
            <Text style={cameraCaptureStyles.infoText}>We need your permission to use the camera.</Text>
            <Button title="Grant Permission" onPress={requestPermission} />
            <Button title="Cancel" onPress={onCancel} style={{marginTop: 10}} />
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel} transparent={false}>
      <View style={cameraCaptureStyles.cameraContainer}>
        <CameraView 
            ref={cameraRef} 
            style={StyleSheet.absoluteFill} 
            facing={'front'}
            onCameraReady={() => setIsCameraReady(true)}
        />
        <View style={cameraCaptureStyles.cameraControlsOverlay}>
            <Pressable onPress={onCancel} style={cameraCaptureStyles.closeButton}>
                <XIcon size={28} color="white" />
            </Pressable>
            <Pressable onPress={handleTakePicture} style={cameraCaptureStyles.captureButtonOuter} disabled={!isCameraReady}>
                <View style={cameraCaptureStyles.captureButtonInner} />
            </Pressable>
            <View style={{width: 40}} /> 
        </View>
      </View>
    </Modal>
  );
};

const cameraCaptureStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: 10, 
    padding: 25,
    alignItems: 'center',
    width: '85%',
    maxWidth: 350,
  },
  modalContentContainerPadded: {
    backgroundColor: theme.colors.background,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    width: '80%',
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 15,
    color: theme.colors.secondary.darkGray,
    textAlign: 'center',
    marginBottom: 20,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  cameraControlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  closeButton: {
    padding: 10,
  },
  captureButtonOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  captureButtonInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'white',
  },
  // Styles for the stubbed Button
  genericButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    backgroundColor: theme.colors.primary.purple, // Example color
    borderRadius: 8, // Example border radius
    marginVertical: 8,
    alignItems: 'center',
  },
  genericButtonText: {
    color: theme.colors.primary.white, // Example color
    fontSize: 15,
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: theme.colors.secondary.mediumGray, // Example disabled color
  },
});

export default CameraCapture; 