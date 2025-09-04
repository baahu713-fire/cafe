import db from './mockDatabase';

// Get all favorite items for a user
export const getFavorites = (userId) => {
    return new Promise((resolve) => {
        const user = db.users.find(u => u.id === userId);
        if (user && user.favorites) {
            const favoriteItems = db.menu.filter(item => user.favorites.includes(item.id));
            resolve(favoriteItems);
        } else {
            resolve([]);
        }
    });
};

// Add an item to a user's favorites
export const addFavorite = (userId, itemId) => {
    return new Promise((resolve) => {
        const user = db.users.find(u => u.id === userId);
        if (user) {
            if (!user.favorites) {
                user.favorites = [];
            }
            if (!user.favorites.includes(itemId)) {
                user.favorites.push(itemId);
            }
        }
        resolve();
    });
};

// Remove an item from a user's favorites
export const removeFavorite = (userId, itemId) => {
    return new Promise((resolve) => {
        const user = db.users.find(u => u.id === userId);
        if (user && user.favorites) {
            user.favorites = user.favorites.filter(id => id !== itemId);
        }
        resolve();
    });
};