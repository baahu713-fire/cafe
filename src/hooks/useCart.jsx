import React, { createContext, useState, useEffect, useContext } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        try {
            const savedCart = localStorage.getItem('cart');
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (error) {
            console.error("Error parsing cart from localStorage", error);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (item) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(i => i.id === item.id);
            if (existingItem) {
                return prevCart.map(i => 
                    i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                );
            } else {
                return [...prevCart, { ...item, quantity: 1 }];
            }
        });
    };

    const updateCart = (item, quantity) => {
        if (quantity <= 0) {
            removeFromCart(item.id);
        } else {
            setCart(prevCart => 
                prevCart.map(i => 
                    i.id === item.id ? { ...i, quantity } : i
                )
            );
        }
    };

    const removeFromCart = (itemId) => {
        setCart(prevCart => prevCart.filter(i => i.id !== itemId));
    };

    const clearCart = () => {
        setCart([]);
    };

    const totalCartItems = cart.reduce((total, item) => total + item.quantity, 0);

    const value = {
        cart,
        addToCart,
        updateCart,
        removeFromCart,
        clearCart,
        totalCartItems
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
