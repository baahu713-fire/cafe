const db = {
  users: [
    { id: 1, email: 'admin@cybercafe.com', password: 'password', role: 'admin', isAdmin: true },
    { id: 2, email: 'customer@test.com', password: 'password', role: 'customer', isAdmin: false },
  ],
  nextUserId: 3,
  menuItems: [
    {
      id: 1,
      name: 'Masala Dosa',
      price: 150,
      image: 'https://images.unsplash.com/photo-1626500448329-b6311b59b64c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80',
      availability: ['all', 'breakfast']
    },
    {
      id: 2,
      name: 'Vada Pav',
      price: 120,
      image: 'https://images.unsplash.com/photo-1626500448329-b6311b59b64c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80',
      availability: ['all', 'snacks']
    },
    {
      id: 3,
      name: 'Chole Bhature',
      price: 200,
      image: 'https://images.unsplash.com/photo-1626500448329-b6311b59b64c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80',
      availability: ['all', 'lunch', 'dinner']
    },
    {
      id: 4,
      name: 'Masala Chai',
      price: 50,
      image: 'https://images.unsplash.com/photo-1626500448329-b6311b59b64c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80',
      availability: ['all', 'beverages']
    },
    {
      id: 5,
      name: 'Chicken Biryani',
      price: 350,
      image: 'https://images.unsplash.com/photo-1626500448329-b6311b59b64c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80',
      availability: ['all', 'lunch', 'dinner']
    },
    {
      id: 6,
      name: 'Samosa',
      price: 80,
      image: 'https://images.unsplash.com/photo-1626500448329-b6311b59b64c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80',
      availability: ['all', 'snacks']
    },
    {
      id: 7,
      name: 'Filter Coffee',
      price: 70,
      image: 'https://images.unsplash.com/photo-1626500448329-b6311b59b64c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80',
      availability: ['all', 'beverages']
    },
    {
      id: 8,
      name: 'Lassi',
      price: 100,
      image: 'https://images.unsplash.com/photo-1626500448329-b6311b59b64c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80',
      availability: ['all', 'beverages']
    },
    {
      id: 9,
      name: 'Pani Puri',
      price: 60,
      image: 'https://images.unsplash.com/photo-1626500448329-b6311b59b64c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80',
      availability: ['all', 'snacks']
    }
  ],
  orders: [],
  favorites: [],
};

export default db;
