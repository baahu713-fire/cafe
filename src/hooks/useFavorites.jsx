import React, { createContext, useState, useContext, useCallback } from 'react';

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
    const [favorites, setFavorites] = useState(() => {
        try {
            const savedFavorites = localStorage.getItem('favorites');
            return savedFavorites ? JSON.parse(savedFavorites) : [];
        } catch (error) {
            console.error("Error parsing favorites from localStorage", error);
            return [];
        }
    });

    const toggleFavorite = useCallback((item) => {
        setFavorites(prevFavorites => {
            const isFavorited = prevFavorites.some(fav => fav.id === item.id);
            let updatedFavorites;
            if (isFavorited) {
                updatedFavorites = prevFavorites.filter(fav => fav.id !== item.id);
            } else {
                updatedFavorites = [...prevFavorites, item];
            }
            localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
            return updatedFavorites;
        });
    }, []);

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