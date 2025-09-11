import React, { createContext, useContext, useState, useEffect } from 'react';

const FavoritesContext = createContext();

export const useFavorites = () => useContext(FavoritesContext);

export const FavoritesProvider = ({ children, user }) => {
    const [favorites, setFavorites] = useState(() => {
        try {
            const savedFavorites = localStorage.getItem(`favorites_${user?.id}`);
            return savedFavorites ? JSON.parse(savedFavorites) : [];
        } catch (error) {
            console.error("Error parsing favorites from localStorage", error);
            return [];
        }
    });

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
