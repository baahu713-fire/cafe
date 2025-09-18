import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useUsers = (user) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchUsers = useCallback(async () => {
        if (!user || !user.isAdmin) return;
        setLoading(true);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await axios.get('/api/users/all', config);
            setUsers(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    return { users, loading, error, fetchUsers };
};

export default useUsers;
