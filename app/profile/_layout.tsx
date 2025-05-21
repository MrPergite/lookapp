import { Redirect, router, Stack, useNavigation } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
import { useScreenHistoryContext } from '@/common/providers/screen-history';
import { useEffect } from 'react';
import { UserDetailsProvider } from '@/common/providers/user-details';
import { Button } from 'react-native';
import BackButton from '../(authn)/components/BackButton';
import { LinearGradient } from 'expo-linear-gradient';
export default function ProfileRoutesLayout() {

    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    headerTransparent: true,
                    headerBackVisible: false, // hide default back button
                    headerTitle: '',
                    headerShown: true,
                    gestureEnabled: true,
                    headerLeft: () => {
                        return (
                             <BackButton customStyle={{ top: 0, left: 0}} />
                       

                        )
                    }
                }}
            />
        </Stack>
    )
}