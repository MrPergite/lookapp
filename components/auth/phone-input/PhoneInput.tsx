import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import theme from '@/styles/theme';
import { COUNTRY_CODES } from './country-codes';


interface PhoneInputProps {
  value: string;
  onChange: (val: string) => void;
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  placeholder?: string;
  error?: string | null;
  style?: any;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  countryCode,
  onCountryCodeChange,
  placeholder = 'Enter your phone number',
  error,
  style,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={[styles.container]}>
      <TouchableOpacity style={styles.codeSelector} onPress={() => setModalVisible(true)}>
        <Text style={styles.codeText}>{COUNTRY_CODES.find(c => c.code === countryCode)?.label || countryCode}</Text>
      </TouchableOpacity>
      <TextInput
        style={[styles.input, style, error && styles.inputError, { padding: 14 }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        keyboardType="phone-pad"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <FlatList
              data={COUNTRY_CODES}
              keyExtractor={item => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => {
                    onCountryCodeChange(item.code);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.countryText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
    backgroundColor: 'transparent',
  },
  codeSelector: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    marginRight: 8,
  },
  codeText: {
    fontSize: 16,
    fontFamily: 'default-medium',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 12,
    fontSize: 16,
    fontFamily: 'default-medium',
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginLeft: 8,
    fontFamily: 'default-semibold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: 280,
    maxHeight: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  countryItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  countryText: {
    fontSize: 16,
    fontFamily: 'default-medium',
  },
});

export default PhoneInput; 