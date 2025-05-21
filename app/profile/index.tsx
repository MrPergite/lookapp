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
import theme from '@/styles/theme'

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
                return null
            }
        },
        enabled: isAuthenticated
    })

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.primary.white }}>
        {isAuthenticated ? <PostLoginScreen userName={user?.name} /> : <PreLoginScreen />}
    </SafeAreaView>
    )
}

export default Profile
