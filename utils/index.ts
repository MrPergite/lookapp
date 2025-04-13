import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Dimensions } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";


export function withHaptick(fn: Function) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    return function (...args: any[]) {
        fn(...args)
    }
}

export function responsiveFontSize(size: number) {
    return RFValue(size, Dimensions.get('window').height)
}

export const getSavedDetails = async (key: string) => {
    try {
        const userRawDetails = await AsyncStorage.getItem('userDetails');
        if (!userRawDetails) {
            return null;
        }
        const userDetails = JSON.parse(userRawDetails);
        return userDetails[key] || null;
    } catch (error) {
        console.error('Error getting user details:', error);
        return null;
    }
}

export const saveDetails = async (key: string, value: Record<string, any> | string) => {
    try {
        const userRawDetails = await AsyncStorage.getItem('userDetails');
        if (!userRawDetails) {
            return null;
        }
        const userDetails = JSON.parse(userRawDetails);
        userDetails[key] = value;
        await AsyncStorage.setItem('userDetails', JSON.stringify(userDetails));
    } catch (error) {
        console.error('Error saving details:', error);
    }
}