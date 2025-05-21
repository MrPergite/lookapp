// useSearchInput.ts

import { useState, useRef, useCallback } from 'react';
import { TextInput, NativeSyntheticEvent, TextInputSubmitEditingEventData, TextInputContentSizeChangeEventData } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useImageContext } from '../../../../../common/providers/image-search';
import { chatActions, useChatProducts } from '../context';
// import usePostHog from '../../../../common/hooks/postHog';

type Mode = 'text' | 'url' | 'social' | 'upload';

interface UseSearchInputParams {
  inputValue: string;
  setInputValue: (text: string) => void;
  setSearchText: (text: string) => void;
}

interface UseSearchInputReturn {
  textareaRef: React.RefObject<TextInput>;
  isUploadDialogOpen: boolean;
  setIsUploadDialogOpen: (open: boolean) => void;
  isWardrobeOpen: boolean;
  setIsWardrobeOpen: (open: boolean) => void;
  isFocused: boolean;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  selectedItem: any;
  setSelectedItem: (item: any) => void;
  uploadType: Mode;
  setUploadType: (type: Mode) => void;
  inputHeight: number;
  handleInputChange: (text: string) => void;
  handleSearch: () => void;
  handleFocus: () => void;
  handleBlur: () => void;
  handleSubmitEditing: (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => void;
  handleContentSizeChange: (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function useSearchInput({
  inputValue,
  setInputValue,
  setSearchText,
}: UseSearchInputParams): UseSearchInputReturn {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isWardrobeOpen, setIsWardrobeOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [uploadType, setUploadType] = useState<Mode>('upload');
  const [inputHeight, setInputHeight] = useState(40);
  const {
    inputType,
    dispatch,
  } = useChatProducts();

  const textareaRef = useRef<TextInput>(null);
  const navigation = useNavigation<NavigationProp<Record<string, object | undefined>>>();
  // const { setSearchResults, setInitialSearch, setSearchText, setIsDesktopVisible } = useImageContext();
  // const { trackEvent } = usePostHog();

  const detectInputType = useCallback((value: string) => {
    if (value.includes('instagram.com') || value.includes('tiktok.com')) {
      dispatch(chatActions.setInputType('social'));
    }  else {
      dispatch(chatActions.setInputType('text'));
    }
  }, [dispatch]);

  const handleInputChange = (text: string) => {
    detectInputType(text);
    setInputValue(text);
    setSearchText(text);
    setShowSuggestions(text.length === 0 && isFocused);
  };

  const handleSearch = () => {
    if (inputValue?.trim()) {
      if (inputValue.includes('instagram.com') || inputValue.includes('tiktok.com')) {
          // trackEvent("handle_search", { button: "Social Media Search", event:'Click' });
          // navigate(`/socialmediafinder/search?url=${encodeURIComponent(inputValue.trim())}`);
        } else {
        if (inputValue.trim()) {
          setSearchText(inputValue.trim());
        }
      }
      setInputValue('');
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(inputValue.length === 0);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    handleSearch();
  };

  const handleBlur = () => {
    // slight delay so onSelect from suggestions can fire
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
    }, 150);
  };

  const handleSubmitEditing = (_e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
    handleSearch();
  };

  const handleContentSizeChange = (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
    const height = e.nativeEvent.contentSize.height;
    setInputHeight(Math.min(Math.max(height, 40), 200));
  };

  return {
    textareaRef,
    isUploadDialogOpen,
    setIsUploadDialogOpen,
    isWardrobeOpen,
    setIsWardrobeOpen,
    isFocused,
    showSuggestions,
    setShowSuggestions,
    selectedItem,
    setSelectedItem,
    uploadType,
    setUploadType,
    inputHeight,
    handleInputChange,
    handleSearch,
    handleFocus,
    handleBlur,
    handleSubmitEditing,
    handleContentSizeChange,
    handleKeyDown
  };
}

