# Project Blueprint

## Overview

This document outlines the architecture and features of the restaurant ordering application.

## Features

### Implemented

*   **User Authentication:** Users can register and log in to the application.
*   **Menu:** Users can view the restaurant's menu.
*   **Shopping Cart:** Users can add items to their cart and place orders.
*   **Order History:** Users can view their past orders.
*   **Favorites:** Users can mark items as favorites.
*   **Admin Panel:** Administrators can manage menu items, users, and orders.
*   **Photo and Team Selection:** Users can upload a profile photo and select a team during registration.
*   **Mandatory Photo Upload:** Photo upload is now required for user registration.
*   **Admin Order User Search:** Administrators can search for users by email when placing an order on their behalf from the cart page.
*   **Enhanced Admin Order View:** The "Manage Orders" section in the admin dashboard now displays the username and email for each order, with search functionality for these fields.

### Fixes

*   **Registration Page Refresh Loop:** Fixed a bug where the registration page would continuously refresh due to a failed attempt to fetch the list of teams. The route for fetching teams was incorrectly protected by authentication middleware, which has now been removed.
*   **Large File Upload Error Handling:** Implemented graceful error handling for large file uploads on the registration page. The backend now sends a specific error message, which is displayed to the user on the frontend.
*   **Item Availability Display:** The menu now accurately reflects item availability. Unavailable items are visually disabled with a vintage look, and the "Add to Cart" button is disabled, preventing users from adding out-of-stock items to their cart.
*   **Reordering with Outdated Prices:** Fixed a bug where reordering an item would use the historical price from the original order instead of the current price. The reorder logic now fetches the latest item details from the menu to ensure accurate pricing and availability.
