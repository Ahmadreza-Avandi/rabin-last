// Helper function to get auth token from cookie or localStorage
export const getAuthToken = () => {
    if (typeof window !== 'undefined') {
        try {
            // First try to get from cookie
            const cookieToken = document.cookie
                .split('; ')
                .find(row => row.startsWith('auth-token='))
                ?.split('=')[1];

            if (cookieToken) {
                console.log('✅ Auth token found in cookie');
                return cookieToken;
            }

            // Try tenant_token as fallback
            const tenantToken = document.cookie
                .split('; ')
                .find(row => row.startsWith('tenant_token='))
                ?.split('=')[1];

            if (tenantToken) {
                console.log('✅ Auth token found in tenant_token cookie');
                return tenantToken;
            }

            // Fallback to localStorage
            const storageToken = localStorage.getItem('auth-token');
            if (storageToken) {
                console.log('✅ Auth token found in localStorage');
                return storageToken;
            }

            console.warn('⚠️  No auth token found in cookies or localStorage');
            console.log('Available cookies:', document.cookie);
        } catch (error) {
            console.error('Error getting auth token:', error);
        }
    }
    return null;
};

// Helper function to get current user from localStorage
export const getCurrentUser = () => {
    if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    }
    return null;
};

// Helper function to clear auth data
export const clearAuthData = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('auth-token');
        document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
};

// Helper function to logout
export const logout = () => {
    clearAuthData();
};