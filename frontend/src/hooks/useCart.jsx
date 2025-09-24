import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth
import { placeOrder as placeOrderService } from '../services/orderService';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

// The user prop is removed from the function signature
const CartProvider = ({ children }) => {
    const { user } = useAuth(); // Get user from AuthContext

    // Utility to sanitize cart items, ensuring prices are numbers
    const sanitizeCart = (cartItems) => {
        if (!Array.isArray(cartItems)) return [];
        return cartItems.map(item => {
            const price = item.proportion?.price ?? item.price;
            const numericPrice = parseFloat(price);

            return {
                ...item,
                price: isNaN(numericPrice) ? 0 : numericPrice,
                ...(item.proportion && {
                    proportion: {
                        ...item.proportion,
                        price: isNaN(numericPrice) ? 0 : numericPrice
                    }
                })
            };
        });
    };

    const [cart, setCart] = useState(() => {
        try {
            const savedCart = localStorage.getItem('cart');
            const parsedCart = savedCart ? JSON.parse(savedCart) : [];
            return sanitizeCart(parsedCart);
        } catch (error) {
            console.error("Error parsing or sanitizing cart from localStorage", error);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [orderError, setOrderError] = useState(null);
    const [orderSuccess, setOrderSuccess] = useState(false);

    const getCartItemId = (item) => `${item.id}-${item.proportion?.name || 'Standard'}`;

    const addToCart = useCallback((item, quantity = 1) => {
        setOrderSuccess(false);
        setOrderError(null);

        setCart(prevCart => {
            const cartItemId = getCartItemId(item);
            const existingItem = prevCart.find(i => getCartItemId(i) === cartItemId);
            const price = item.proportion?.price ?? item.price;
            const numericPrice = parseFloat(price);

            if (isNaN(numericPrice)) {
                console.error("Attempted to add an item with an invalid price:", item);
                return prevCart;
            }

            if (existingItem) {
                return prevCart.map(i =>
                    getCartItemId(i) === cartItemId ? { ...i, quantity: i.quantity + quantity } : i
                );
            } else {
                return [...prevCart, { ...item, quantity, price: numericPrice }];
            }
        });
    }, []);

    const removeFromCart = useCallback((itemId, proportionName) => {
        const cartItemId = `${itemId}-${proportionName || 'Standard'}`;
        setCart(prevCart => prevCart.filter(i => getCartItemId(i) !== cartItemId));
    }, []);

    const updateQuantity = useCallback((itemId, quantity, proportionName) => {
        const cartItemId = `${itemId}-${proportionName || 'Standard'}`;
        setCart(prevCart =>
            prevCart.map(i =>
                getCartItemId(i) === cartItemId ? { ...i, quantity: Math.max(0, quantity) } : i
            ).filter(i => i.quantity > 0)
        );
    }, []);

    const clearCart = useCallback(() => {
        setCart([]);
    }, []);

    const placeOrder = async (comment, userIdToOrderFor = null) => {
        if (!user) {
            setOrderError("You must be logged in to place an order.");
            return;
        }

        const finalUserId = user.isAdmin && userIdToOrderFor ? userIdToOrderFor : user.id;
        if (!finalUserId) {
            setOrderError("Could not determine the user for the order.");
            return;
        }

        setIsPlacingOrder(true);
        setOrderError(null);
        setOrderSuccess(false);

        const orderData = {
            userId: finalUserId,
            items: cart.map(item => {
                const proportionName = item.proportion?.name;
                let finalProportionName;

                if (typeof proportionName === 'string' && proportionName !== 'Standard') {
                    finalProportionName = proportionName;
                }

                return {
                    menu_item_id: item.id,
                    quantity: item.quantity,
                    proportion_name: finalProportionName,
                };
            }),
            comment: comment,
        };

        try {
            await placeOrderService(orderData);
            setOrderSuccess(true);
            clearCart();
        } catch (error) {
            setOrderError(error.message || "Failed to place order. Please try again.");
        } finally {
            setIsPlacingOrder(false);
        }
    };

    const totalPrice = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    const itemCount = cart.reduce((count, item) => count + item.quantity, 0);

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
        setOrderError,
        itemCount,
        totalPrice,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export default CartProvider;
