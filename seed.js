// ──────────────────────────────────────────────
//  FreshCart — Database Seeder
//  Run: node seed.js
// ──────────────────────────────────────────────

require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");

const sampleProducts = [
  // 🍎 Fruits
  { name: "Organic Apples",      category: "Fruits",     price: 149, unit: "1 kg",   emoji: "🍎", description: "Fresh organic Fuji apples, crisp and sweet.",            inStock: true,  rating: 4.8 },
  { name: "Bananas",             category: "Fruits",     price: 45,  unit: "1 dozen", emoji: "🍌", description: "Ripe Cavendish bananas, perfect for smoothies.",         inStock: true,  rating: 4.6 },
  { name: "Strawberries",        category: "Fruits",     price: 199, unit: "250 g",  emoji: "🍓", description: "Sweet, juicy strawberries — farm fresh.",                inStock: true,  rating: 4.9 },
  { name: "Avocados",            category: "Fruits",     price: 250, unit: "2 pcs",  emoji: "🥑", description: "Creamy Hass avocados, ready to eat.",                    inStock: true,  rating: 4.7 },
  { name: "Mangoes",             category: "Fruits",     price: 120, unit: "1 kg",   emoji: "🥭", description: "Alphonso mangoes, king of fruits.",                      inStock: true,  rating: 4.9 },

  // 🥦 Vegetables
  { name: "Baby Spinach",        category: "Vegetables", price: 40,  unit: "200 g",  emoji: "🥬", description: "Tender baby spinach leaves, triple-washed.",             inStock: true,  rating: 4.5 },
  { name: "Cherry Tomatoes",     category: "Vegetables", price: 60,  unit: "500 g",  emoji: "🍅", description: "Vine-ripened cherry tomatoes, bursting with flavor.",    inStock: true,  rating: 4.6 },
  { name: "Broccoli",           category: "Vegetables", price: 55,  unit: "1 head", emoji: "🥦", description: "Fresh green broccoli crowns.",                           inStock: true,  rating: 4.4 },
  { name: "Sweet Bell Peppers",  category: "Vegetables", price: 80,  unit: "3 pcs",  emoji: "🫑", description: "Mix of red, yellow, and green bell peppers.",           inStock: false, rating: 4.3 },
  { name: "Onions",             category: "Vegetables", price: 35,  unit: "1 kg",   emoji: "🧅", description: "Fresh red onions, essential for Indian cooking.",         inStock: true,  rating: 4.2 },
  { name: "Potatoes",           category: "Vegetables", price: 30,  unit: "1 kg",   emoji: "🥔", description: "Fresh potatoes, versatile and nutritious.",              inStock: true,  rating: 4.4 },

  // 🧀 Dairy
  { name: "Whole Milk",          category: "Dairy",      price: 68,  unit: "1 L",    emoji: "🥛", description: "Farm-fresh whole milk, pasteurized.",                    inStock: true,  rating: 4.7 },
  { name: "Greek Yogurt",        category: "Dairy",      price: 110, unit: "500 g",  emoji: "🍶", description: "Thick, creamy Greek yogurt — high protein.",             inStock: true,  rating: 4.8 },
  { name: "Cheddar Cheese",      category: "Dairy",      price: 220, unit: "200 g",  emoji: "🧀", description: "Aged sharp cheddar, perfect for sandwiches.",           inStock: true,  rating: 4.6 },
  { name: "Free-Range Eggs",     category: "Dairy",      price: 90,  unit: "12 pcs", emoji: "🥚", description: "Free-range large eggs, farm-to-table.",                 inStock: true,  rating: 4.9 },
  { name: "Paneer",              category: "Dairy",      price: 95,  unit: "200 g",  emoji: "🧈", description: "Fresh cottage cheese, great for curries.",               inStock: true,  rating: 4.7 },

  // 🍞 Bakery
  { name: "Sourdough Bread",     category: "Bakery",     price: 120, unit: "1 loaf", emoji: "🍞", description: "Artisan sourdough with a crispy crust.",                inStock: true,  rating: 4.8 },
  { name: "Croissants",          category: "Bakery",     price: 150, unit: "4 pcs",  emoji: "🥐", description: "Buttery, flaky French croissants.",                     inStock: true,  rating: 4.7 },
  { name: "Bagels",             category: "Bakery",     price: 100, unit: "6 pcs",  emoji: "🥯", description: "New York-style everything bagels.",                      inStock: true,  rating: 4.5 },

  // 🥤 Beverages
  { name: "Cold-Pressed OJ",     category: "Beverages",  price: 150, unit: "1 L",    emoji: "🧃", description: "100% cold-pressed orange juice, no sugar added.",       inStock: true,  rating: 4.9 },
  { name: "Sparkling Water",     category: "Beverages",  price: 40,  unit: "500 ml", emoji: "💧", description: "Natural sparkling mineral water.",                      inStock: true,  rating: 4.3 },
  { name: "Oat Milk",            category: "Beverages",  price: 180, unit: "1 L",    emoji: "🥛", description: "Barista-edition oat milk, froths beautifully.",          inStock: true,  rating: 4.6 },
  { name: "Green Tea",           category: "Beverages",  price: 130, unit: "25 bags", emoji: "🍵", description: "Organic green tea, rich in antioxidants.",              inStock: true,  rating: 4.5 },

  // 🍿 Snacks
  { name: "Trail Mix",           category: "Snacks",     price: 250, unit: "300 g",  emoji: "🥜", description: "Almonds, cashews, cranberries, and dark chocolate.",     inStock: true,  rating: 4.7 },
  { name: "Dark Chocolate",      category: "Snacks",     price: 130, unit: "100 g",  emoji: "🍫", description: "72% cacao Belgian dark chocolate.",                     inStock: true,  rating: 4.8 },
  { name: "Rice Crackers",       category: "Snacks",     price: 75,  unit: "150 g",  emoji: "🍘", description: "Crispy Japanese rice crackers with soy glaze.",          inStock: true,  rating: 4.4 },
  { name: "Granola Bars",        category: "Snacks",     price: 160, unit: "6 pcs",  emoji: "🥜", description: "Honey oat granola bars with almond butter.",            inStock: true,  rating: 4.5 },
  { name: "Masala Chips",        category: "Snacks",     price: 30,  unit: "150 g",  emoji: "🍟", description: "Spicy masala flavored potato chips.",                   inStock: true,  rating: 4.3 },
];

async function seedDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing products
    await Product.deleteMany({});
    console.log("🗑️  Cleared existing products");

    // Insert sample products
    const inserted = await Product.insertMany(sampleProducts);
    console.log(`🌱 Seeded ${inserted.length} products`);

    console.log("\n📦 Products added:");
    inserted.forEach((p) => {
      console.log(`   ${p.emoji} ${p.name} — ₹${p.price}/${p.unit}`);
    });

    await mongoose.connection.close();
    console.log("\n✅ Database seeded successfully! You can now start the server.");
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
}

seedDB();
