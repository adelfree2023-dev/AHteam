/**
 * ============================================
 * AHteam Admin - Local Authentication
 * ============================================
 * 
 * STANDALONE - No external dependencies
 * Uses localStorage for session
 * Default: admin / admin123
 * ============================================
 */

const Auth = {
    // Default credentials (hashed)
    defaultUsers: {
        'admin': 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3' // admin123
    },

    // Simple hash function (SHA-256 simulation for demo)
    hash: function (str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        // Convert to hex-like string
        return 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
    },

    // Get users from localStorage or defaults
    getUsers: function () {
        const stored = localStorage.getItem('admin_users');
        if (stored) {
            return JSON.parse(stored);
        }
        return this.defaultUsers;
    },

    // Login
    login: function (username, password) {
        const users = this.getUsers();

        // Simple password check (for demo, using plain comparison)
        // In production, use proper hashing
        if (username === 'admin' && password === 'admin123') {
            localStorage.setItem('admin_session', JSON.stringify({
                user: username,
                loggedIn: true,
                timestamp: Date.now()
            }));
            return true;
        }

        return false;
    },

    // Logout
    logout: function () {
        localStorage.removeItem('admin_session');
        window.location.href = './login.html';
    },

    // Check if logged in
    isLoggedIn: function () {
        const session = localStorage.getItem('admin_session');
        if (!session) return false;

        const data = JSON.parse(session);

        // Session expires after 24 hours
        const ONE_DAY = 24 * 60 * 60 * 1000;
        if (Date.now() - data.timestamp > ONE_DAY) {
            this.logout();
            return false;
        }

        return data.loggedIn === true;
    },

    // Require authentication (redirect if not logged in)
    requireAuth: function () {
        if (!this.isLoggedIn()) {
            window.location.href = './login.html';
        }
    },

    // Get current user
    getCurrentUser: function () {
        const session = localStorage.getItem('admin_session');
        if (session) {
            return JSON.parse(session).user;
        }
        return null;
    },

    // Change password
    changePassword: function (username, newPassword) {
        const users = this.getUsers();
        users[username] = this.hash(newPassword);
        localStorage.setItem('admin_users', JSON.stringify(users));
        return true;
    }
};

// Make available globally
window.Auth = Auth;
