-- Drop existing tables if they exist to ensure a clean slate, handling dependencies.
DROP TABLE IF EXISTS refunds CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu CASCADE;
DROP TABLE IF EXISTS active_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS registration_keys CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;

-- Function to update the updated_at column for any table.
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Table for user teams or departments.
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

-- Table for role-based permissions
CREATE TABLE role_permissions (
    role VARCHAR(50) PRIMARY KEY,
    max_concurrent_sessions INT NOT NULL
);

-- Table for registration keys to control new user sign-ups.
CREATE TABLE registration_keys (
    id SERIAL PRIMARY KEY,
    key_value VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'normal', -- e.g., 'normal', 'admin', 'team_lead'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ
);

-- Users table with roles, team association, and authentication details.
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'normal',
    team_id INT REFERENCES teams(id) ON DELETE SET NULL,
    photo BYTEA, -- Store image data directly in the database
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cns_role_check CHECK (role IN ('admin', 'superadmin', 'normal'))
);

-- Trigger to automatically update the updated_at timestamp for users.
CREATE TRIGGER set_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Session table for managing user login sessions, linked to Redis.
CREATE TABLE active_sessions (
  session_id VARCHAR(255) PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  client_ip INET NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Menu table for daily meal options.
CREATE TABLE menu (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    options TEXT NOT NULL,  -- Storing menu options as a JSON string or comma-separated values
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Orders table to track user meal choices.
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    menu_id INT NOT NULL REFERENCES menu(id) ON DELETE RESTRICT,
    -- Redundant fields to preserve historical data even if user/menu changes
    user_name VARCHAR(255),
    username VARCHAR(255),
    team_name VARCHAR(255),
    -- End of redundant fields
    total_price NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- e.g., pending, confirmed, delivered, cancelled
    comment TEXT,
    disputed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    -- Constraint to ensure a user can only have one order per menu (per day)
    UNIQUE(user_id, menu_id)
);

-- Trigger to automatically update the updated_at timestamp for orders.
CREATE TRIGGER set_orders_timestamp
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Order items table to detail the contents of each order.
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    -- Redundant fields for historical accuracy, in case item names/prices change
    name_at_order VARCHAR(255) NOT NULL,
    price_at_order NUMERIC(10, 2) NOT NULL, 
    quantity INT NOT NULL
);

-- Refunds table for tracking order cancellations by admins that require a refund.
CREATE TABLE refunds (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE SET NULL, -- User who placed the order
    processed_by INT REFERENCES users(id) ON DELETE SET NULL, -- Admin who processed the refund
    amount NUMERIC(10, 2) NOT NULL,
    reason TEXT, -- e.g., "Cancelled by admin after delivery"
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Pre-populate with some data for development and testing
INSERT INTO teams (name) VALUES ('Engineering'), ('Sales'), ('Marketing'), ('HR');
INSERT INTO registration_keys (key_value, role, is_active) VALUES ('admin_key_123', 'admin', TRUE), ('user_key_456', 'normal', TRUE);
INSERT INTO role_permissions (role, max_concurrent_sessions) VALUES ('admin', 3), ('superadmin', 1), ('normal', 1);
