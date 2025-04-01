import { ThemedText } from '@/components/ThemedText'
import theme from '@/styles/theme'
import { withHaptick } from '@/utils'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useOnBoarding } from '../context'

const GenderSelect = () => {
    const { payload, dispatch } = useOnBoarding()
    const getStyles = (key: string) => {
        if (payload?.gender === key) {
            return {
                bg: theme.colors.primary.purple,
                icon: theme.colors.primary.white,
                text: theme.colors.primary.white
            }
        }
        return {
            bg: theme.colors.primary.white,
            icon: theme.colors.secondary.black,
            text: theme.colors.secondary.black
        }


    }
    const [mStyles, fStyles] = [getStyles("male"), getStyles("female")]
    const handleSelect = (value: string) => {
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
                <Ionicons color={mStyles.icon} size={52} name='man-outline' />
                <ThemedText type='default' style={[{ color: mStyles.text }]} >Male</ThemedText>
            </Pressable>
            <Pressable onPress={() => withHaptick(handleSelect)("female")} style={[styles.cardContainer, { backgroundColor: fStyles.bg }]}>
                <Ionicons color={fStyles.icon} size={52} name='woman-outline' />
                <ThemedText type='default' style={[{ color: fStyles.text }]} >Female</ThemedText>
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    flexContainer: {
        display: "flex",
        flexDirection: "row",
        gap: theme.spacing.lg
    },
    cardContainer: {
        backgroundColor: theme.colors.primary.purple,
        padding: theme.spacing.md,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: "10%",
        shadowColor: theme.colors.secondary.darkGray,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    }
});


export default GenderSelect
