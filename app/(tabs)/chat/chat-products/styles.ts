import theme from "@/styles/theme";
import { responsiveFontSize } from "@/utils";
import { StyleSheet } from "react-native";

export // Styles don't include colors - they're applied dynamically based on theme
    const styles = StyleSheet.create({
        mainContainer: {
            flex: 1,
        },
        container: {
            flex: 1,
        },
        contentContainer: {
            paddingBottom: 20, // Reduced padding without input box
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: 1,
            position: 'absolute',
            top: 0,
            zIndex: 1000,
        },
        backButton: {
            marginRight: 16,
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: '600',
        },
        chatHistoryContainer: {
            padding: 16,
            margin: theme.spacing.md,
            // borderWidth: 1,
            opacity: 0.9,
            flex: 1,
            // backgroundColor: 'rgba(255, 255, 255, 0.5)', // white/40
            borderRadius: 24, // rounded-3xl = 1.5rem = 24px
            marginHorizontal: 24, // mx-6 = 1.5rem = 24px
            overflow: 'hidden',
            flexDirection: 'column',
            // Shadow for iOS
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            // Shadow for Android
            elevation: 5,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 #0000, 0 0 #0000',
        },
        conversationGroup: {
            marginBottom: 24,
            borderBottomWidth: 0,
            paddingBottom: 16,
        },
        messageContainer: {
            marginBottom: 16,
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'flex-start',
            width: '100%',
        },
        aiMessageContainer: {
            marginBottom: 16,
            flexDirection: 'row',
            alignItems: 'flex-start',
            width: '100%',
        },
        avatarContainer: {
            marginRight: 12,
            height: 56,
            width: 40,
            // backgroundColor: theme.colors.primary.white,
            borderRadius: 18,
        },
        avatarGradient: {
            width: 36,
            height: 36,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
        },
        avatarText: {
            color: theme.colors.primary.white,
            fontSize: 18,
            fontWeight: '600',
        },
        userAvatarContainer: {
            padding: 6,
            borderRadius: 20,
            marginLeft: 8,
        },
        userAvatarBackground: {
            width: 28,
            height: 28,
            // borderRadius: 18,
            // backgroundColor: theme.colors.primary.lavender,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
        },
        userAvatarText: {
            color: theme.colors.secondary.darkGray,
            fontSize: 16,
            fontWeight: '500',
        },
        userMessageContainer: {
            maxWidth: '55%',
            borderRadius: 20,
            overflow: 'hidden',
            shadowColor: theme.colors.secondary.black,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.03,
            shadowRadius: 3,
            elevation: 1
        },
        userMessageGradient: {
            padding: 16,
            borderRadius: 20,
        },
        userMessage: {
            borderRadius: 20,
            padding: 16,
            backgroundColor: '#f0e6ff',
            maxWidth: '75%',
            shadowColor: theme.colors.secondary.black,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.03,
            shadowRadius: 3,
            elevation: 1,
        },
        aiMessage: {
            borderRadius: 20,
            padding: 16,
            backgroundColor: theme.colors.primary.white,
            maxWidth: '65%',
            flex: 1,
            shadowColor: theme.colors.secondary.black,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.03,
            shadowRadius: 3,
            elevation: 1,
        },
        messageText: {
            fontSize: responsiveFontSize(14),
            color: theme.colors.primary.white,
            lineHeight: 22,
            fontFamily: 'default-regular',
            fontWeight: '700',
        },
        messageImage: {
            width: '100%',
            height: 150,
            borderRadius: 8,
            marginTop: 8,
        },
        loadingContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            borderRadius: 20,
            backgroundColor: theme.colors.primary.white,
            maxWidth: '75%',
            flex: 1,
        },
        loadingText: {
            marginLeft: 8,
            fontSize: 16,
            color: theme.colors.secondary.darkGray,
        },
        productSection: {
            marginTop: 8,
            marginBottom: 16,
        },
        productGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginHorizontal: 0,
            justifyContent: 'space-between',
        },
        productItemLeft: {
            width: '48.5%',
            marginBottom: 16,
        },
        productItemRight: {
            width: '48.5%',
            marginBottom: 16,
        },
        productItem: {
            borderRadius: 16,
            overflow: 'hidden',
            backgroundColor: 'transparent',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
        },
        productTouchable: {
            width: '100%',
        },
        imageWrapper: {
            position: 'relative',
            width: "100%",
            height: 270
        },
        productImage: {
            width: '100%',
            height: '100%',
        },
        imagePlaceholder: {
            width: '100%',
            height: '100%',
            backgroundColor: '#f2f2f2',
            justifyContent: 'center',
            alignItems: 'center',
        },
        placeholderText: {
            fontSize: 12,
            marginTop: 8,
            color: '#777777',
        },
        imageGradient: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 160,
            justifyContent: 'flex-end',
            padding: 16,
        },
        productLabel: {
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 48,
            left: 10,
        },
        brandLabel: {
            fontSize: 13,
            fontWeight: '500',
            color: '#f5f5f5',
            marginBottom: 4,
            textTransform: 'uppercase',
        },
        nameLabel: {
            fontSize: 16,
            fontWeight: '700',
            color: '#ffffff',
            marginBottom: 6,
        },
        priceLabel: {
            fontSize: 20,
            fontWeight: '600',
            color: '#ffffff',
            fontFamily: 'default-semibold',
        },
        actionOverlay: {
            position: 'absolute',
            bottom: 6,
            left: 10,
            right: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
        },
        leftActions: {
            flexDirection: 'row',
            gap: 8,
        },
        actionIconButton: {
            borderRadius: 17,
            backgroundColor: 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
        },
        bookmarkButton: {
            width: 28,
            height: 28,
            borderRadius: 21,
            backgroundColor: theme.colors.primary.purple,
            justifyContent: 'center',
            alignItems: 'center',
        },
        bookmarkButtonActive: {
            backgroundColor: '#6b5cd1',
        },
        successButton: {
            backgroundColor: '#4CAF50', // Green
        },
        errorButton: {
            backgroundColor: '#F44336', // Red
        },
        loadingButton: {
            backgroundColor: '#6b5cd1',
        },
        productBottom: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 10,
            paddingRight: 12,
        },
        ratingContainer: {
            flexDirection: 'row',
            gap: 8,
        },
        ratingButton: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: '#6b5cd1',
            justifyContent: 'center',
            alignItems: 'center',
        },
        saveBtn: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#f7f7f7',
            justifyContent: 'center',
            alignItems: 'center',
        },
        activeBtn: {
            backgroundColor: '#6b5cd1',
        },
        seeMoreButton: {
            alignItems: 'center',
            paddingVertical: 12,
            borderRadius: 8,
        },
        seeMoreText: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.secondary.veryDarkGray,
            fontFamily: 'default-semibold',
        },
        productImageWrapper: {
            width: "100%",
            height: "100%",
            position: 'relative',
            overflow: 'hidden',
        },
        followUpActions: {
            position: 'absolute',
            top: 8, // Tailwind's top-2 = 0.5rem = 8px
            left: 8, // Tailwind's left-2 = 0.5rem = 8px
            zIndex: 10,
            padding: 8,
            borderRadius: 9999, // Tailwind's rounded-full
            backgroundColor: 'rgba(255, 255, 255, 0.85)', // bg-white/90
            shadowColor: '#000', // shadow-sm equivalent
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 1, // for Android shadow

        },
    });