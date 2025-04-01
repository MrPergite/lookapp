export const routes = {
    public: {
        getProducts: '/products',
        getCategories: '/categories',
        getPublicProfile: '/profiles/public'
    },

    // Protected endpoints that require authentication
    protected: {
        getUserProfile: '/user/profile',
        getOrders: '/user/orders',
        updateProfile: '/user/profile/update'
    }
}