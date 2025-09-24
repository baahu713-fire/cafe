import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth

const FavoritesContext = createContext();

export const useFavorites = () => useContext(FavoritesContext);

// The user prop is removed from the function signature
export const FavoritesProvider = ({ children }) => {
    const { user } = useAuth(); // Get user from AuthContext
    const [favorites, setFavorites] = useState([]);

    // Effect to load favorites from localStorage when user changes
    useEffect(() => {
        if (user) {
            try {
                const savedFavorites = localStorage.getItem(`favorites_${user.id}`);
                setFavorites(savedFavorites ? JSON.parse(savedFavorites) : []);
            } catch (error) {
                console.error("Error parsing favorites from localStorage", error);
                setFavorites([]);
            }
        } else {
            // If there is no user, clear the favorites
            setFavorites([]);
        }
    }, [user]);

    // Effect to save favorites to localStorage when they change
    useEffect(() => {
        if (user) {
            localStorage.setItem(`favorites_${user.id}`, JSON.stringify(favorites));
        }
    }, [favorites, user]);

    const addFavorite = (item) => {
        setFavorites(prevFavorites => {
            if (!prevFavorites.find(f => f.id === item.id)) {
                return [...prevFavorites, item];
            }
            return prevFavorites;
        });
    };

    const removeFavorite = (itemId) => {
        setFavorites(prevFavorites => prevFavorites.filter(f => f.id !== itemId));
    };

    const isFavorite = (itemId) => {
        return favorites.some(f => f.id === itemId);
    };

    const value = {
        favorites,
        addFavorite,
        removeFavorite,
        isFavorite,
    };

    return (
        <FavoritesContext.Provider value={value}>
            {children}
        </FavoritesContext.Provider>
    );
};
