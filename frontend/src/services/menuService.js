import api from './api';

// The backend now sends and receives arrays directly, so no adaptation is needed.
const adaptMenuItemToFrontend = (item) => {
    return item;
};

export const getMenu = async () => {
    // No auth needed to view the menu
    const response = await api.get('/menu');
    // The backend sends arrays, so we no longer need to adapt every item.
    return response.data;
};

export const addMenuItem = async (itemData) => {
    // The backend now expects an array for availability.
    const response = await api.post('/menu', itemData);
    return response.data;
};

export const updateMenuItem = async (itemId, itemData) => {
    // The backend now expects an array for availability.
    const response = await api.put(`/menu/${itemId}`, itemData);
    return response.data;
};

export const deleteMenuItem = async (itemId) => {
    await api.delete(`/menu/${itemId}`);
    return { message: 'Item deleted successfully' };
};
