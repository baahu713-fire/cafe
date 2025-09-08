import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children, user }) => {
    const [favorites, setFavorites] = useState([]);

    // Load favorites from localStorage when user changes
    useEffect(() => {
        if (user) {
            try {
                const savedFavorites = localStorage.getItem(`favorites_${user.id}`);
                setFavorites(savedFavorites ? JSON.parse(savedFavorites) : []);
            } catch (error) {
                console.error("Error parsing user favorites from localStorage", error);
                setFavorites([]);
            }
        } else {
            // No user, so clear favorites
            setFavorites([]);
        }
    }, [user]);

    const toggleFavorite = useCallback((item) => {
        if (!user) {
            // Or alert the user they need to be logged in
            console.log("User must be logged in to have favorites.");
            return;
        }

        setFavorites(prevFavorites => {
            const isFavorited = prevFavorites.some(fav => fav.id === item.id);
            let updatedFavorites;
            if (isFavorited) {
                updatedFavorites = prevFavorites.filter(fav => fav.id !== item.id);
            } else {
                updatedFavorites = [...prevFavorites, item];
            }
            localStorage.setItem(`favorites_${user.id}`, JSON.stringify(updatedFavorites));
            return updatedFavorites;
        });
    }, [user]); // Rerun when user changes

    const value = {
        favorites,
        toggleFavorite
    };

    return (
        <FavoritesContext.Provider value={value}>
            {children}
        </FavoritesContext.Provider>
    );
};