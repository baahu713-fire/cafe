import api from './api';

export const getMenu = async () => {
    const response = await api.get('/menu');
    return response.data;
};

/**
 * Get all menu items for admin (no category filtering)
 */
export const getMenuAdmin = async () => {
    const response = await api.get('/menu/admin/all');
    return response.data;
};

export const getMenuItemsByCategory = async (category) => {
    const response = await api.get(`/menu/category/${category}`);
    return response.data;
};

export const addMenuItem = async (formData) => {
    const response = await api.post('/menu', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const updateMenuItem = async (itemId, formData) => {
    const response = await api.put(`/menu/${itemId}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const deleteMenuItem = async (itemId) => {
    await api.delete(`/menu/${itemId}`);
    return { message: 'Item deleted successfully' };
};

export const getDailySpecials = async (type) => {
    try {
        const params = type ? { type } : {};
        const response = await api.get('/daily-specials', { params }); // Changed axios.get to api.get to maintain consistency with existing file structure
        return response.data;
    } catch (error) {
        throw error;
    }
};
