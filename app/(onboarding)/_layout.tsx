import { Redirect, Stack } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
import { Text, View } from 'react-native'

export default function OnboardingLayout() {
    const { isLoaded, isSignedIn } = useAuth();

    // Show loading state while Clerk is initializing
    if (!isLoaded) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Loading...</Text>
            </View>
        );
    }

    // Redirect to sign in if not authenticated
    if (!isSignedIn) {
        return <Redirect href="/(authn)/signin" />;
    }

    return <Stack screenOptions={{ headerShown: false }} />
}