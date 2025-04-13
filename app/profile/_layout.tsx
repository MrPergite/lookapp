import { useAuth } from '@clerk/clerk-expo'
import React, { useEffect } from 'react'
import { PostLoginScreen, PreLoginScreen } from '@/components/auth'
import { useQuery } from '@tanstack/react-query'
import { useApi } from '@/client-api'
import { routes } from '@/client-api/routes'
import axios from 'axios'
import Constants from 'expo-constants'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native'

function Profile() {
    const { isSignedIn, getToken } = useAuth()
    const { callProtectedEndpoint, isAuthenticated } = useApi()
    const { data: user } = useQuery<{ name: string }>({
        queryKey: ['userName'],
        queryFn: async () => {
            try {
                if (isAuthenticated) {
                    const token = await getToken()
                    const response = await axios.get(`${Constants.expoConfig?.extra?.origin}/api/users/getUserName`, {
                        method: "GET",
                        headers: {
                            "Authorization": `Bearer ${token}`
                        }
                    })
                    return response.data
                }
                else {
                    return null
                }
            }
            catch (error) {
                console.log("inside catch", error)
                return null
            }
        },
        enabled: isAuthenticated
    })
    const endpoint = Constants.expoConfig?.extra?.origin

    console.log({ user: user })

    return (
        <LinearGradient
            style={{ flex: 1 }}
            colors={
                [
                    'rgba(250, 245, 255, 0.5)', // purple-50/50
                    'rgba(243, 232, 255, 0.3)', // purple-100/30
                    'rgba(255, 241, 246, 0.5)', // pink-50/50
                ]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <SafeAreaView style={{ flex: 1 }}>
                {isAuthenticated ? <PostLoginScreen userName={user?.name} /> : <PreLoginScreen />}
            </SafeAreaView>
        </LinearGradient>
    )
}

export default Profile
