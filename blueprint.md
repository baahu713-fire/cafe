# Project Blueprint

## Overview

This is a React-based food ordering application for a "CyberCafe". It allows users to browse a menu of food, snacks, and drinks, add items to a cart, and place orders. It also includes user authentication and an admin dashboard for managing the menu.

## Implemented Features

*   **User Authentication:** Users can register, login, and logout. The UI adapts based on authentication status.
*   **Direct Menu Access:** The application opens directly to the menu page, streamlining the ordering process.
*   **Search/Filter Menu:** Users can search for specific items on the menu page and filter by category.
*   **Shopping Cart:** Users can add items to a shopping cart, view the cart, update quantities, and remove items.
*   **Order History:** Logged-in users can view their past orders.
*   **Admin Dashboard:** Authenticated admin users can access a dashboard to manage the menu and view a list of all registered users.
*   **Favorites:** Logged-in users can add items to a "Favorites" list for later viewing.
*   **Menu Management:** Administrators can add, edit, and delete menu items from the admin dashboard.

## Styling and Design

*   **Component Library:** The application uses Material-UI (MUI) for its UI components.
*   **Theme:** A custom theme is implemented with a primary color of deep purple and a secondary color of amber, with a tech-focused "CyberCafe" aesthetic.
*   **Typography:** The "Poppins" font is used throughout the application.
*   **Layout:** The application uses a responsive grid layout to display menu items. The search and filter controls on the menu page are arranged vertically for a clean and intuitive user experience.
*   **Icons:** The application uses icons from `@mui/icons-material` for the user menu, shopping cart, and favorites.

## Current Plan

*   **Bug Fixes and Refactoring:**
    *   **Favorites Functionality:** Fixed a bug where the favorites feature was not working correctly. Centralized the favorites state using a `FavoritesProvider` and `useFavorites` hook to ensure consistency across the application.
    *   **Menu Page Crash:** Resolved a crash on the menu page by correctly fetching data from the `menuService.js`.
    *   **Search and Filter:** Re-implemented the search and category filtering functionality on the menu page, which was accidentally removed in a previous update.
    *   **UI Layout:** Adjusted the layout of the search and filter controls on the menu page, placing the category filters below the search bar for a more organized look.
