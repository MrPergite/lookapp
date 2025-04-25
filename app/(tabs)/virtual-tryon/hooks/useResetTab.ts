import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react'

function useResetTab(resetFunction: () => void) {
    const navigation = useNavigation();

    useEffect(() => {
        if (navigation && navigation.isFocused()) {
            // @ts-ignore - Type error with React Navigation event listener
            const unsubscribe = navigation.addListener('tabPress', e => {
                resetFunction();
            });

            return unsubscribe;
        }
    }, [navigation]);
}

export default useResetTab
