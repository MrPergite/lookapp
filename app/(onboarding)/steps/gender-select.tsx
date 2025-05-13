import { ThemedText } from '@/components/ThemedText'
import theme from '@/styles/theme'
import { saveDetails, withHaptick } from '@/utils'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useOnBoarding } from '../context'
import { User, UserRound } from 'lucide-react-native'

const GenderSelect = ({ goToNextStep }: { goToNextStep: () => void }) => {
    const { payload, dispatch } = useOnBoarding()
    const getStyles = (key: string) => {
        if (payload?.gender === key) {
            return {
                bg: theme.colors.primary.purple,
                icon: theme.colors.primary.white,
                text: theme.colors.primary.white,
            }
        }
        return {
            bg: theme.colors.primary.white,
            icon: theme.colors.secondary.black,
            text: theme.colors.secondary.black
        }


    }
    const [mStyles, fStyles] = [getStyles("male"), getStyles("female")]
    const handleSelect = async (value: string) => {
        goToNextStep()
        await saveDetails("gender", value)
        dispatch({
            type: "SET_PAYLOAD",
            payload: { key: "gender", value }
        })
    }
    return (
        <View style={styles.flexContainer} >
            <Pressable onPress={() => {
                withHaptick(handleSelect)("male")
            }} style={[styles.cardContainer, { backgroundColor: mStyles.bg }]}>
                <User style={{ marginBottom: 10 }} color={mStyles.icon} size={24} />
                <ThemedText type='default' style={[{
                    color: mStyles.text, fontSize: 14, fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;',
                }]} >Male</ThemedText>
            </Pressable>
            <Pressable onPress={() => withHaptick(handleSelect)("female")} style={[styles.cardContainer, { backgroundColor: fStyles.bg }]}>
                <UserRound style={{ marginBottom: 10 }} color={fStyles.icon} size={24} />
                <ThemedText type='default' style={[{
                    color: fStyles.text, fontSize: 14, fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;',
                }]} >Female</ThemedText>
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    flexContainer: {
        display: "flex",
        flexDirection: "row",
        gap: theme.spacing.lg,
        padding: theme.spacing.xl
    },
    cardContainer: {
        backgroundColor: theme.colors.primary.purple,
        padding: theme.spacing.md,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: "10%",
        // shadowColor: theme.colors.secondary.darkGray,
        // shadowOffset: { width: 0, height: 4 },
        // shadowOpacity: 0.3,
        shadowRadius: 5,
        // elevation: 4,
        width: 95,
        height: 100
    }
});


export default GenderSelect
