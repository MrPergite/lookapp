export const routes = {
    public: {
        getProducts: '/api/products',
        getCategories: '/api/categories',
        getPublicProfile: '/api/profiles/public',
        searchProducts: '/api/products/searchPublic',
        searchPartPublic: '/api/products/searchPartPublic',
        postReaction: '/api/reaction/cardReactionPublic',
        getProductDetails: '/api/product-details/get-product-details',
        prodCardQueryPublic: '/api/products/prodCardQueryPublic'
    },

    // Protected endpoints that require authentication
    protected: {
        getUserProfile: '/api/user/profile',
        getOrders: '/api/user/orders',
        updateProfile: '/api/user/profile/update',
        getOnboardingInfo: '/api/users/onboarding',
        saveOnboardingInfo: '/api/users/onboarding',
        searchProductsAuth: '/api/products/searchPublic',
        searchPart: '/api/products/searchPart',
        postReaction: '/api/reaction/cardReaction',
        saveShoppingList: '/api/shoppingList/shoppingListNew',
        getProductDetails: '/api/product-details/get-product-details',
        getUserName: '/api/users/getUserName',
        prodCardQuery: '/api/products/prodCardQuery',
    }
}