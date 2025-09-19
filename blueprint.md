# Project Blueprint

## Overview

This document outlines the architecture and features of the Food Ordering PWA. The application is a progressive web app built with React for the frontend and a Node.js/Express backend.

## Features

### Core Features

*   **User Authentication:** Users can register, log in, and log out. Admins have a separate login and dashboard.
*   **Menu Management:** Admins can add, edit, and delete menu items.
*   **Order Management:** Users can place orders, view their order history, and cancel recent orders. Admins can manage all orders, update their status, and settle user accounts.
*   **Shopping Cart:** Users can add items to their cart and checkout.
*   **Favorites:** Users can mark items as favorites for easy reordering.
*   **Feedback:** Users can leave feedback and a rating on their orders.
*   **Order Dispute:** Users can dispute an order from their "My Orders" page.
*   **Dispute Visibility:** Admins can see which orders have been disputed in the "Manage Orders" dashboard.

### New Features

*   **Dockerization:** The entire application is now containerized with Docker and can be run with Docker Compose.

## Technical Details

*   **Frontend:** React, Material-UI, Nginx
*   **Backend:** Node.js, Express, PostgreSQL
*   **Authentication:** JWT
*   **Containerization:** Docker, Docker Compose

## Current Task: Dockerize the Application

*   **Objective:** Containerize the frontend and backend applications to run with Docker Compose.
*   **Steps Taken:**
    1.  Created a `Dockerfile` for the backend Node.js application.
    2.  Created a `Dockerfile` for the frontend React application, using a multi-stage build with Nginx.
    3.  Added an `nginx.conf` file to the frontend to proxy API requests.
    4.  Created a `docker-compose.yml` file to define and link the `frontend`, `backend`, and `db` services.
