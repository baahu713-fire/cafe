import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as loginService, register as signupService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // <-- The critical loading state

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            // If parsing fails, treat it as no user is logged in.
            console.error("Failed to parse user from localStorage", error);
            setUser(null);
            localStorage.removeItem('user');
        }
        // CRITICAL: Set loading to false only after checking storage.
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const loggedInUser = await loginService(email, password);
        localStorage.setItem('user', JSON.stringify(loggedInUser));
        setUser(loggedInUser);
        // Navigation is handled by the LoginPage component and ProtectedRoute
    };

    const signup = async (formData) => {
        const newUser = await signupService(formData);
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
        // Navigation is handled by the RegisterPage component
    };

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
        // Navigation is handled by the component that calls logout (e.g., AppBar)
    };

    const updateUser = (updatedUserData) => {
        // Ensure we don't accidentally overwrite the whole user object
        setUser(prevUser => {
            const newUser = { ...prevUser, ...updatedUserData };
            localStorage.setItem('user', JSON.stringify(newUser));
            return newUser;
        });
    };

    // The value now includes the loading state
    const value = {
        user,
        loading, // <-- Expose the loading state
        login,
        signup,
        logout,
        updateUser,
    };

    // Render children only when not loading, or let children handle the loading state themselves
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
