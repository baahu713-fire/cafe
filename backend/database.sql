CREATE TABLE menu_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  category VARCHAR(50)
);

INSERT INTO menu_items (name, description, price, category) VALUES
('Cheeseburger', 'A classic cheeseburger with all the fixings.', 9.99, 'Burgers'),
('Margherita Pizza', 'Fresh mozzarella, tomatoes, and basil.', 12.50, 'Pizzas'),
('Caesar Salad', 'Crisp romaine lettuce with Caesar dressing and croutons.', 7.99, 'Salads');
