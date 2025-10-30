import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useActiveUsers = (user) => {
    const [activeUsers, setActiveUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchActiveUsers = useCallback(async () => {
        if (!user || !user.isAdmin) return;
        setLoading(true);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await axios.get('/api/users/active', config);
            setActiveUsers(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch active users');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchActiveUsers();
    }, [fetchActiveUsers]);

    return { activeUsers, loading, error, fetchActiveUsers };
};

export default useActiveUsers;