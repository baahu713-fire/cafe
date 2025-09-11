import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { server } from '../mocks/server'; 

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Admin can order for another user', () => {
  test('places an order for a selected user', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    // Log in as admin
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Wait for redirect to menu
    await waitFor(() => expect(screen.getByText(/our menu/i)).toBeInTheDocument());

    // Select a user to order for
    await waitFor(() => {
        const userSelect = screen.getByLabelText(/order for/i)
        expect(userSelect).toBeInTheDocument();
        fireEvent.change(userSelect, { target: { value: '2' } }); // Assuming user with id '2' exists
    });
    

    // Add an item to the cart
    const addToCartButton = await screen.findAllByRole('button', { name: /add to cart/i });
    fireEvent.click(addToCartButton[0]);

    // Navigate to the cart page
    const cartLink = screen.getByRole('link', { name: /cart/i });
    fireEvent.click(cartLink);

    // Place the order
    const placeOrderButton = await screen.findByRole('button', { name: /proceed to checkout/i });
    fireEvent.click(placeOrderButton);

    // Verify the order was placed (and implicitly for the correct user)
    await waitFor(() => {
        expect(screen.getByText(/order placed successfully! redirecting.../i)).toBeInTheDocument();
    });
  });
});
