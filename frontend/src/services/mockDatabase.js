export const CANCELLATION_WINDOW_MS = 60000; // 1 minute

const db = {
  users: [
    { id: 1, email: 'admin@thecafecentral.com', password: 'password', role: 'admin', isAdmin: true },
    { id: 2, email: 'customer@test.com', password: 'password', role: 'customer', isAdmin: false },
  ],
  nextUserId: 3,
  nextOrderId: 1,
  menuItems: [
    {
      id: 1,
      name: 'Masala Dosa',
      price: 150,
      image: '/images/masala-dosa.jpg',
      description: 'A crispy South Indian crepe made from fermented rice and lentil batter, filled with a savory potato stuffing.',
      availability: ['All', 'Breakfast'],
      proportions: [{ name: 'Full', price: 150 }]
    },
    {
      id: 2,
      name: 'Vada Pav',
      price: 120,
      image: '/images/vada-pav.jpg',
      description: 'A popular Mumbai street food, featuring a spiced potato fritter in a soft bread roll.',
      availability: ['All', 'Snacks'],
      proportions: [{ name: 'Full', price: 120 }]
    },
    {
      id: 3,
      name: 'Chole Bhature',
      price: 200,
      image: '/images/chole-bhature.jpg',
      description: 'A classic Punjabi dish with spicy chickpeas and fluffy, deep-fried bread.',
      availability: ['All', 'Lunch', 'Dinner'],
      proportions: [{ name: 'Full', price: 200 }]
    },
    {
      id: 4,
      name: 'Masala Chai',
      price: 50,
      image: '/images/masala-chai.jpg',
      description: 'Aromatic and spiced Indian tea made with a blend of herbs and spices.',
      availability: ['All', 'Beverages'],
      proportions: [{ name: 'Full', price: 50 }]
    },
    {
      id: 5,
      name: 'Chicken Biryani',
      price: 350,
      image: '/images/chicken-biryani.jpg',
      description: 'A flavorful and aromatic rice dish made with tender chicken and a blend of rich spices.',
      availability: ['All', 'Lunch', 'Dinner'],
      proportions: [{ name: 'Full', price: 350 }]
    },
    {
      id: 6,
      name: 'Samosa',
      price: 80,
      image: '/images/samosa.jpg',
      description: 'A crispy, triangular pastry filled with a savory mixture of spiced potatoes and peas.',
      availability: ['All', 'Snacks'],
      proportions: [{ name: 'Full', price: 80 }]
    },
    {
      id: 7,
      name: 'Filter Coffee',
      price: 70,
      image: '/images/filter-coffee.jpg',
      description: 'A traditional South Indian coffee, brewed strong and served with frothy milk.',
      availability: ['All', 'Beverages'],
      proportions: [{ name: 'Full', price: 70 }]
    },
    {
      id: 8,
      name: 'Lassi',
      price: 100,
      image: '/images/lassi.jpg',
      description: 'A creamy and refreshing yogurt-based drink, perfect for cooling down.',
      availability: ['All', 'Beverages'],
      proportions: [{ name: 'Full', price: 100 }]
    },
    {
      id: 9,
      name: 'Pani Puri',
      price: 60,
      image: '/images/pani-puri.jpg',
      description: 'A popular street snack with hollow, crispy shells filled with a tangy and spicy mixture.',
      availability: ['All', 'Snacks'],
      proportions: [{ name: 'Full', price: 60 }]
    }
  ],
  orders: [],
  favorites: [],
  feedback: [],
};

export default db;
