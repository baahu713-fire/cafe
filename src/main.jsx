import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { CartProvider } from './hooks/useCart.jsx';
import { FavoritesProvider } from './hooks/useFavorites.jsx';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <CartProvider>
        <FavoritesProvider>
          <App />
        </FavoritesProvider>
      </CartProvider>
    </Router>
  </StrictMode>,
);
