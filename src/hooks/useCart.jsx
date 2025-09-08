import React, { createContext, useContext, useState, useEffect } from 'react';
import { placeOrder as placeOrderService } from '../services/orderService';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children, user }) => {
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

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const addToCart = (item, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(i => i.id === item.id);
      if (existingItem) {
        return prevCart.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      } else {
        return [...prevCart, { ...item, quantity }];
      }
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    setCart(prevCart => prevCart.map(i => 
      i.id === itemId ? { ...i, quantity: Math.max(0, quantity) } : i
    ).filter(i => i.quantity > 0));
  };

  const clearCart = () => {
    setCart([]);
  };

  const placeOrder = async (comments, userIdToOrderFor = null) => {
    if (!user) {
      setOrderError("You must be logged in to place an order.");
      return;
    }
    
    const finalUserId = user.isAdmin && userIdToOrderFor ? userIdToOrderFor : user.id;

    setIsPlacingOrder(true);
    setOrderError(null);
    setOrderSuccess(false);

    try {
      await placeOrderService(finalUserId, cart, comments);
      setOrderSuccess(true);
      clearCart();
    } catch (error) {
      setOrderError(error.message || "Failed to place order. Please try again.");
      console.error(error);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    placeOrder,
    isPlacingOrder,
    orderError,
    orderSuccess,
    setOrderSuccess,
    itemCount: cart.reduce((count, item) => count + item.quantity, 0),
    totalPrice: cart.reduce((total, item) => total + item.price * item.quantity, 0),
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};