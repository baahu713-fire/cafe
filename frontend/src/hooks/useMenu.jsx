import { useState, useEffect, useCallback } from 'react';
import { getMenu as fetchMenuFromDB, getMenuAdmin, addMenuItem, updateMenuItem, deleteMenuItem } from '../services/menuService';

/**
 * Hook for menu items
 * @param {Object} options - Options
 * @param {boolean} options.isAdmin - If true, fetches ALL items (no category filtering)
 */
const useMenu = (options = {}) => {
  const { isAdmin = false } = options;
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      // Use admin endpoint if isAdmin is true
      const items = isAdmin ? await getMenuAdmin() : await fetchMenuFromDB();
      setMenuItems(items);
      setError(null);
    } catch (err) {
      setError('Failed to fetch menu items.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const handleAddMenuItem = async (item) => {
    await addMenuItem(item);
    await fetchMenu();
  };

  const handleUpdateMenuItem = async (id, item) => {
    await updateMenuItem(id, item);
    await fetchMenu();
  };

  const handleDeleteMenuItem = async (id) => {
    await deleteMenuItem(id);
    await fetchMenu();
  };

  return {
    menuItems,
    loading,
    error,
    fetchMenu,
    addMenuItem: handleAddMenuItem,
    updateMenuItem: handleUpdateMenuItem,
    deleteMenuItem: handleDeleteMenuItem,
  };
};

export default useMenu;

