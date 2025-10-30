-- Teams Table: Represents a group or organization within the system.
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    activated_from TIMESTAMPTZ NOT NULL DEFAULT NOW() -- Timestamp of when the team was created.
);

-- Users Table: Stores user information for authentication and roles.
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(20) UNIQUE NOT NULL CHECK (char_length(username) >= 5 AND char_length(username) <= 20),
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(20), -- Role of the user (e.g., 'admin', 'staff').
    team_id INTEGER REFERENCES teams(id), -- The team the user belongs to.
    photo_url VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Menu Items Table: Stores all available food and beverage items.
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    image VARCHAR(255),
    availability VARCHAR(255)[], -- Array of categories (e.g., "breakfast", "lunch").
    proportions JSONB, -- JSON for different sizes/options, e.g., {"Small": 8.99, "Large": 12.99}.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_from TIMESTAMPTZ, -- Timestamp for soft-deleting the item.
    available BOOLEAN NOT NULL DEFAULT TRUE
);

-- Orders Table: Stores the main information for each order.
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total_price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    comment TEXT
);

-- Order Items Table: A join table linking menu items to specific orders.
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    menu_item_id INTEGER REFERENCES menu_items(id),
    proportion_name VARCHAR(255), -- The name of the selected proportion (e.g., "Large").
    quantity INTEGER NOT NULL,
    price_at_order NUMERIC(10, 2) NOT NULL,
    name_at_order VARCHAR(255) NOT NULL -- Full name as ordered (e.g., "Coffee (Large)").
);

-- Registration Keys Table: Stores unique keys for user registration.
CREATE TABLE registration_keys (
    id SERIAL PRIMARY KEY,
    registration_key VARCHAR(255) UNIQUE NOT NULL,
    team_id INTEGER REFERENCES teams(id) NOT NULL, -- Each key is tied to a specific team.
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used_at TIMESTAMPTZ,
    used_by_user_id INTEGER REFERENCES users(id)
);

-- Feedback Table for orders
CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) UNIQUE NOT NULL, -- Each order can only have one feedback entry
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- Sample Data
INSERT INTO teams (name) VALUES ('Main Branch'), ('Second Branch');

INSERT INTO menu_items (name, description, price, availability, proportions) VALUES
('Coffee', 'Freshly brewed coffee.', 2.50, '{"breakfast", "lunch"}', '[{"name": "Small", "price": 2.50}, {"name":"Medium", "price": 3.00}, {"name":"Large", "price": 3.50}]'),
('Croissant', 'Buttery and flaky.', 3.00, '{"breakfast"}', '[{"name": "Small", "price": 2.50}, {"name":"Large", "price": 3.50}]'),
('Sandwich', 'Turkey and swiss on wheat.', 8.00, '{"lunch"}', NULL);
