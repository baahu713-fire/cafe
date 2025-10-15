import api from './api';

export const getMenu = async () => {
    const response = await api.get('/menu');
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
