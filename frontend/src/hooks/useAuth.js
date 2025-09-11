import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginService, register as signupService } from '../services/authService';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = async (email, password) => {
        const loggedInUser = await loginService(email, password);
        localStorage.setItem('user', JSON.stringify(loggedInUser));
        setUser(loggedInUser);
        navigate(loggedInUser.isAdmin ? '/admin' : '/');
    };

    const signup = async (email, password) => {
        const newUser = await signupService(email, password);
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
        navigate('/');
    };

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
        navigate('/');
    };

    return { user, login, signup, logout };
};
