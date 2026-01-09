import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, login as loginService, register as signupService, logout as logoutService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Helper function to transform the user object from the backend
    const augmentUser = (userData) => {
        if (!userData) {
            return null;
        }
        // Create the 'isAdmin' and 'isSuperAdmin' booleans based on the 'role' string
        return {
            ...userData,
            isAdmin: userData.role === 'admin' || userData.role === 'superadmin',
            isSuperAdmin: userData.role === 'superadmin'
        };
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await getMe();
                setUser(augmentUser(currentUser));
            } catch (error) {
                // This can happen if the cookie is invalid or the backend is down
                console.error("Failed to fetch user:", error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const login = async (username, password) => {
        const loggedInUser = await loginService(username, password);
        setUser(augmentUser(loggedInUser));
    };

    const signup = async (formData) => {
        const newUser = await signupService(formData);
        // A newly registered user is typically not an admin, but we run it through the augmenter for consistency.
        setUser(augmentUser(newUser));
        navigate('/');
    };

    const logout = async () => {
        await logoutService();
        setUser(null);
        navigate('/');
    };

    const updateUser = (updatedUserData) => {
        // When updating, we merge with the previous state and re-run the augmentation
        // to ensure isAdmin reflects any potential role change.
        setUser(prevUser => augmentUser({ ...prevUser, ...updatedUserData }));
    };

    const value = {
        user,
        loading,
        login,
        signup,
        logout,
        updateUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};