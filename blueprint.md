# Project Blueprint

## Overview

This document outlines the architecture and implementation details of the project, a web application with a React frontend and a Node.js backend. The application features user authentication, team management, and a registration system that requires a valid key.

## Frontend

- **Framework:** React
- **Styling:** Material-UI (MUI)
- **Routing:** `react-router-dom`
- **State Management:** React Context API (`AuthContext`)

### Key Components

- **`RegisterPage.jsx`:** Handles user registration. It includes fields for Full Name, Username, Password, and a Registration Key. It also requires a profile photo upload.
- **`LoginPage.jsx`:** Manages user login using a username and password.
- **`AuthContext.jsx`:** Provides authentication state and functions (`login`, `signup`, `logout`) to the application.
- **`authService.js`:** Contains functions for making API calls to the backend for authentication.

## Backend

- **Framework:** Node.js with Express
- **Database:** PostgreSQL
- **Authentication:** JWT (JSON Web Tokens)

### API Endpoints

- **`POST /auth/register`:** Registers a new user. Expects `name`, `username`, `password`, `team_id`, `photo`, and `registrationKey`.
- **`POST /auth/login`:** Logs in a user. Expects `username` and `password`.

### Authentication Flow

1.  **Registration:**
    - A user provides their full name, username, password, team, a registration key, and a profile photo.
    - The backend validates the registration key against the selected team.
    - Upon successful validation, a new user is created in the database, and the registration key is marked as used.
    - A JWT is issued to the user.

2.  **Login:**
    - A user submits their username and password.
    - The backend verifies the credentials.
    - If correct, a JWT is returned.

## Recent Changes

- **Username-based Authentication:** The system was updated to use a username for login instead of an email address.
- **Full Name Field:** A "Full Name" field was added to the registration form, and the backend was updated to store this information.
- **Registration Key Validation Fix:** A bug in the registration key validation logic was fixed. The `team_id` is now correctly parsed as an integer before comparison, resolving the "invalid registration key" error.
