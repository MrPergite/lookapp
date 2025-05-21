export const routes = {
    public: {
        getProducts: '/api/products',
        getCategories: '/api/categories',
        getPublicProfile: '/api/profiles/public',
        searchProducts: '/api/products/searchPublic',
        searchPartPublic: '/api/products/searchPartPublic',
        postReaction: '/api/reaction/cardReactionPublic',
        getProductDetails: '/api/product-details/get-product-details',
        prodCardQueryPublic: '/api/products/prodCardQueryPublic',
        findProductsPublic: '/api/users/findProductsPublic',
        getPromptChips: '/api/users/generatePromptChipsPublic',
        getDiscoveryOutfits: '/api/users/discovery'
    },

    // Protected endpoints that require authentication
    protected: {
        getUserProfile: '/api/user/profile',
        getOrders: '/api/user/orders',
        updateProfile: '/api/user/profile/update',
        getOnboardingInfo: '/api/users/onboarding',
        saveOnboardingInfo: '/api/users/onboarding',
        searchProductsAuth: '/api/products/search',
        searchPart: '/api/products/searchPart',
        postReaction: '/api/reaction/cardReaction',
        saveShoppingList: '/api/shoppingList/shoppingListNew',
        getProductDetails: '/api/product-details/get-product-details',
        getUserName: '/api/users/getUserName',
        prodCardQuery: '/api/products/prodCardQuery',
        vtonTryon: '/api/vton/tryon',
        vtonOutfits: '/api/vton/outfits',
        vtonCredits: '/api/vton/credits',
        vtonOutfitsDelete: '/api/vton/outfits',
        uploadImage: '/api/storage/upload',
        createPersonalizedAvatar: '/api/users/createPersonalizedAvatar',
        setPreferredAvatarUrl: '/api/users/setPreferredAvatarUrl',
        registerDigitalWardrobe: '/api/users/registerDigitalWardrobe',
        digitalWardrobeItems: '/api/users/digitalWardrobeItems',
        extractSocials: '/api/users/extractSocials',
        findProducts: '/api/users/findProducts',
        getPromptChipsAuth: '/api/users/generatePromptChips'
      
    }
        // createPersonalizedAvatar: '/api/users/createPersonalizedAvatar',
    
}