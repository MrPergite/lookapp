import { Redirect, Stack } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'

export default function AuthRoutesLayout() {
    const { isSignedIn } = useAuth()

    console.log({ isSignedIn }, "kkk")

    if (isSignedIn) {
        return <Redirect href={'(tabs)'} />
    }

    return <Stack screenOptions={{ headerShown: false }} />
}