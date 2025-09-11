
# **Project Blueprint: FastAPI Backend & React Frontend**

## **1. Overview**

This document outlines the architecture, features, and implementation plan for a comprehensive web application with a FastAPI backend and a React frontend. The application is designed to serve as a food ordering platform with role-based access control for users and administrators.

### **Core Capabilities:**

*   **User Authentication:** Secure user registration and login with JWT-based authentication.
*   **Team Management:** Admins can create, update, and delete teams.
*   **Menu Management:** Admins can manage a detailed menu of food and beverage items, including complex properties like proportions and availability.
*   **Order Processing:** Authenticated users can place orders, and admins can manage order statuses.
*   **Role-Based Access Control (RBAC):** The application distinguishes between regular users and administrators, restricting access to sensitive operations.
*   **Favorites:** Users can mark items as favorites for easy access.
*   **Feedback:** Users can provide feedback on completed orders.

---

## **2. Backend (FastAPI) - Implemented**

The backend is built with Python using the FastAPI framework and connects to a PostgreSQL database.

### **Database Schema:**

*   **`teams`**: Manages organizational units.
*   **`users`**: Stores user credentials, roles (`admin`, `staff`), and team associations.
*   **`menu_items`**: Contains product details, including pricing, availability, soft deletes, and a `JSONB` field for proportions (e.g., sizes).
*   **`orders`**: Header table for customer orders, linking to the user.
*   **`order_items`**: Line items for each order, capturing the price and name of the item at the time of purchase.
*   **`feedback`**: Stores user feedback, including a rating and a comment, linked to an order.

### **API Endpoints & Features:**

*   **`/api/auth`**: User registration and login.
*   **`/api/teams`**: CRUD operations for managing teams (Admin-only).
*   **`/api/menu`**: CRUD operations for menu items, including soft deletes (Admin-only for modifications).
*   **`/api/orders`**: Order creation for users and status management for admins.
*   **`/api/feedback`**: Endpoint for submitting user feedback.

---

## **3. Frontend (React) - Implemented**

The frontend is a modern, responsive, and user-friendly application built with React.

### **Technology Stack:**

*   **Framework:** React (using Vite)
*   **Routing:** `react-router-dom`
*   **API Communication:** `axios`
*   **Component Library:** Material-UI (MUI)
*   **State Management:** React Hooks (`useState`, `useEffect`, `useContext`) and custom hooks (`useMenu`, `useCart`, `useFavorites`).

### **Implemented Features:**

*   **Authentication Flow:** A complete authentication system is in place. Users can register and log in, with JWT tokens managed via `localStorage`. An `AuthContext` provides global state, and a centralized `axios` instance in `services/api.js` automatically attaches the token to authenticated requests.
*   **User-Facing Features:**
    *   **`MenuPage`**: Displays the full menu with search and filtering capabilities. Users can add items to their cart directly from this page.
    *   **`CartPage`**: Shows the items in the user's cart, allowing for quantity adjustments and order placement.
    *   **`OrderHistoryPage`**: Displays a list of the user's past orders with their current status.
    *   **`FeedbackPage`**: Allows users to submit feedback for completed orders.
    *   **`FavoritesPage`**: Displays the user's favorite menu items.
    *   **`MenuItemCard`**: A reusable component to display menu items, with controls for selecting proportions, adding to the cart, and marking as a favorite.
*   **Admin Dashboard:** A feature-rich admin page is available at the `/admin` route, accessible only to users with the 'admin' role. It features a tabbed interface for managing different aspects of the application:
    *   **User Management:** Admins can view a list of all registered users, search them by email, and see a summary of their delivered versus settled orders. It provides a function to settle all of a user's outstanding delivered orders in a single action.
    *   **Order Management:** Admins have a complete overview of all orders placed in the system. They can filter orders by date or search by ID, user email, or status. They can update the status of any order (e.g., 'Pending' to 'Confirmed') and have the ability to cancel pending orders or settle delivered ones.
    *   **Menu Management:** Admins have full CRUD (Create, Read, Update, Delete) capabilities for the restaurant's menu. They can add new items, edit existing ones (including name, description, image, availability, and pricing proportions), and remove items from the menu.

### **Next Steps:**

*   The frontend is feature-complete. The next steps would involve any UI/UX refinements, further testing, and deployment.
