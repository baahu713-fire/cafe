-- Main user table to store login and profile information
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- This should be a hashed password
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Menu items available for order
CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL, -- Base price for items without proportions
    category VARCHAR(100),
    image_url TEXT, -- URL for the item's image
    is_available BOOLEAN DEFAULT true
);

-- Proportions for menu items (e.g., Small, Medium, Large)
CREATE TABLE IF NOT EXISTS proportions (
    id SERIAL PRIMARY KEY,
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., 'Small', 'Large', 'Full Plate'
    price NUMERIC(10, 2) NOT NULL, -- Price for this specific proportion
    UNIQUE (menu_item_id, name)
);

-- Main orders table, linking to a user
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending', -- e.g., Pending, Confirmed, Preparing, Out for Delivery, Completed, Cancelled
    total_price NUMERIC(10, 2) NOT NULL,
    comment TEXT, -- Optional customer comments
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Line items for each order
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price NUMERIC(10, 2) NOT NULL, -- Price at the time of order, could be from menu_items or proportions
    proportion_name VARCHAR(100) -- e.g., 'Large', null if not applicable
);

-- Customer feedback for completed orders
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE, -- Each order can only have one feedback entry
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- User's favorite menu items
CREATE TABLE IF NOT EXISTS favorite_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    UNIQUE (user_id, menu_item_id) -- A user can only favorite an item once
);
