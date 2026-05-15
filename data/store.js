// ──────────────────────────────────────────────
//  FreshCart — In-Memory Data Store
//  Agent 2: Backend Engineer
// ──────────────────────────────────────────────

const products = [
  // 🍎 Fruits
  { id: 1,  name: "Organic Apples",      category: "Fruits",     price: 4.99, unit: "1 kg",   emoji: "🍎", description: "Fresh organic Fuji apples, crisp and sweet.",            inStock: true,  rating: 4.8 },
  { id: 2,  name: "Bananas",             category: "Fruits",     price: 1.49, unit: "1 bunch", emoji: "🍌", description: "Ripe Cavendish bananas, perfect for smoothies.",         inStock: true,  rating: 4.6 },
  { id: 3,  name: "Strawberries",        category: "Fruits",     price: 5.99, unit: "250 g",  emoji: "🍓", description: "Sweet, juicy strawberries — farm fresh.",                inStock: true,  rating: 4.9 },
  { id: 4,  name: "Avocados",            category: "Fruits",     price: 3.49, unit: "2 pcs",  emoji: "🥑", description: "Creamy Hass avocados, ready to eat.",                    inStock: true,  rating: 4.7 },

  // 🥦 Vegetables
  { id: 5,  name: "Baby Spinach",        category: "Vegetables", price: 3.29, unit: "200 g",  emoji: "🥬", description: "Tender baby spinach leaves, triple-washed.",             inStock: true,  rating: 4.5 },
  { id: 6,  name: "Cherry Tomatoes",     category: "Vegetables", price: 3.99, unit: "500 g",  emoji: "🍅", description: "Vine-ripened cherry tomatoes, bursting with flavor.",    inStock: true,  rating: 4.6 },
  { id: 7,  name: "Broccoli",           category: "Vegetables", price: 2.79, unit: "1 head", emoji: "🥦", description: "Fresh green broccoli crowns.",                           inStock: true,  rating: 4.4 },
  { id: 8,  name: "Sweet Bell Peppers",  category: "Vegetables", price: 4.49, unit: "3 pcs",  emoji: "🫑", description: "Mix of red, yellow, and green bell peppers.",           inStock: false, rating: 4.3 },

  // 🧀 Dairy
  { id: 9,  name: "Whole Milk",          category: "Dairy",      price: 3.99, unit: "1 L",    emoji: "🥛", description: "Farm-fresh whole milk, pasteurized.",                    inStock: true,  rating: 4.7 },
  { id: 10, name: "Greek Yogurt",        category: "Dairy",      price: 5.49, unit: "500 g",  emoji: "🍶", description: "Thick, creamy Greek yogurt — high protein.",             inStock: true,  rating: 4.8 },
  { id: 11, name: "Cheddar Cheese",      category: "Dairy",      price: 6.99, unit: "200 g",  emoji: "🧀", description: "Aged sharp cheddar, perfect for sandwiches.",           inStock: true,  rating: 4.6 },
  { id: 12, name: "Free-Range Eggs",     category: "Dairy",      price: 4.99, unit: "12 pcs", emoji: "🥚", description: "Free-range large eggs, farm-to-table.",                 inStock: true,  rating: 4.9 },

  // 🍞 Bakery
  { id: 13, name: "Sourdough Bread",     category: "Bakery",     price: 5.49, unit: "1 loaf", emoji: "🍞", description: "Artisan sourdough with a crispy crust.",                inStock: true,  rating: 4.8 },
  { id: 14, name: "Croissants",          category: "Bakery",     price: 4.99, unit: "4 pcs",  emoji: "🥐", description: "Buttery, flaky French croissants.",                     inStock: true,  rating: 4.7 },
  { id: 15, name: "Bagels",             category: "Bakery",     price: 3.99, unit: "6 pcs",  emoji: "🥯", description: "New York-style everything bagels.",                      inStock: true,  rating: 4.5 },

  // 🥤 Beverages
  { id: 16, name: "Cold-Pressed OJ",     category: "Beverages",  price: 6.99, unit: "1 L",    emoji: "🧃", description: "100% cold-pressed orange juice, no sugar added.",       inStock: true,  rating: 4.9 },
  { id: 17, name: "Sparkling Water",     category: "Beverages",  price: 1.99, unit: "500 ml", emoji: "💧", description: "Natural sparkling mineral water.",                      inStock: true,  rating: 4.3 },
  { id: 18, name: "Oat Milk",            category: "Beverages",  price: 4.49, unit: "1 L",    emoji: "🥛", description: "Barista-edition oat milk, froths beautifully.",          inStock: true,  rating: 4.6 },

  // 🍿 Snacks
  { id: 19, name: "Trail Mix",           category: "Snacks",     price: 7.99, unit: "300 g",  emoji: "🥜", description: "Almonds, cashews, cranberries, and dark chocolate.",     inStock: true,  rating: 4.7 },
  { id: 20, name: "Dark Chocolate",      category: "Snacks",     price: 3.99, unit: "100 g",  emoji: "🍫", description: "72% cacao Belgian dark chocolate.",                     inStock: true,  rating: 4.8 },
  { id: 21, name: "Rice Crackers",       category: "Snacks",     price: 2.99, unit: "150 g",  emoji: "🍘", description: "Crispy Japanese rice crackers with soy glaze.",          inStock: true,  rating: 4.4 },
  { id: 22, name: "Granola Bars",        category: "Snacks",     price: 5.49, unit: "6 pcs",  emoji: "🥜", description: "Honey oat granola bars with almond butter.",            inStock: true,  rating: 4.5 },
];

// In-memory cart
let cart = { items: [] };

// In-memory orders
let orders = [];
let nextOrderId = 1001;

// In-memory admin accounts (shared across all clients)
let admins = [];

module.exports = {
  products,
  cart,
  orders,
  admins,
  getNextOrderId: () => nextOrderId++,
};
