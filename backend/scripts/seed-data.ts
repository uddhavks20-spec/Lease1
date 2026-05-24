import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding database...');
    
    // Add retail_price and sub_attributes columns if they don't exist
    await client.query('ALTER TABLE items ADD COLUMN IF NOT EXISTS retail_price DECIMAL(10,2)');
    await client.query('ALTER TABLE items ADD COLUMN IF NOT EXISTS sub_attributes JSONB');
    
    // Clear existing items and images to prevent duplicates
    await client.query('TRUNCATE TABLE item_images, rentals, items CASCADE');
    
    // 1. Roles
    const rolesResult = await client.query(`
      INSERT INTO roles (name, description) 
      VALUES ('admin', 'Platform Administrator'), ('seller', 'Item Seller'), ('renter', 'Item Renter')
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name
    `);
    const roles: Record<string, string> = {};
    rolesResult.rows.forEach(r => roles[r.name] = r.id);

    // 2. Categories
    const catsResult = await client.query(`
      INSERT INTO categories (name, description, icon) VALUES
      ('Appliances & Cooling', 'Split and Window ACs for campus summers', '❄️'),
      ('Electronics & Entertainment', 'Smart TVs and displays for your room', '📺'),
      ('Study & Furniture', 'Desks, chairs, and mattresses', '🛋️'),
      ('Clothing & Accessories', 'Graduation gowns and winter wear', '👕')
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name
    `);
    const categories: Record<string, string> = {};
    catsResult.rows.forEach(c => categories[c.name] = c.id);

    // 3. Cities
    const citiesResult = await client.query(`
      INSERT INTO cities (name, state, country) 
      VALUES ('Kanpur', 'Uttar Pradesh', 'India'), ('Lucknow', 'Uttar Pradesh', 'India')
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name
    `);
    const cities: Record<string, string> = {};
    citiesResult.rows.forEach(c => cities[c.name] = c.id);

    // 4. Fake Users
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const sellerResult = await client.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role_id, is_verified)
      VALUES ('seller@example.com', $1, 'John', 'Seller', $2, true)
      ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
      RETURNING id
    `, [passwordHash, roles['seller']]);
    const sellerId = sellerResult.rows[0].id;

    // 5. All 33 Master Items from mockProductsData
    const items = [
      // Appliances & Cooling
      { title: '1.5 Ton Split Air Conditioner', cat: 'Appliances & Cooling', rent: 1500, deposit: 1500, retail: 45000, img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=500&q=80', attrs: { "Type": "Split", "Capacity": "1.5 Ton" } },
      { title: '1 Ton Window Air Conditioner', cat: 'Appliances & Cooling', rent: 1200, deposit: 1200, retail: 30000, img: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=500&q=80', attrs: { "Star Rating": "3-Star", "Noise Level": "Standard" } },
      { title: '190L Single Door Refrigerator', cat: 'Appliances & Cooling', rent: 850, deposit: 850, retail: 18000, img: 'https://images.unsplash.com/photo-1571175432247-5c868d32b350?auto=format&fit=crop&w=500&q=80', attrs: { "Capacity": "190L", "Defrost Type": "Direct Cool" } },
      { title: '50L Personal Mini-Fridge', cat: 'Appliances & Cooling', rent: 500, deposit: 500, retail: 12000, img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=500&q=80', attrs: { "Cooling Tech": "Compressor", "Freezer Zone": "Yes" } },
      { title: 'Fully Automatic Washing Machine', cat: 'Appliances & Cooling', rent: 1100, deposit: 1100, retail: 25000, img: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=500&q=80', attrs: { "Loading type": "Top-load", "Drum Capacity": "6.5kg" } },
      { title: 'Semi-Automatic Twin-Tub Washer', cat: 'Appliances & Cooling', rent: 700, deposit: 700, retail: 15000, img: 'https://images.unsplash.com/photo-1545173168-9f1947e80154?auto=format&fit=crop&w=500&q=80', attrs: { "Spin Motor RPM": "1350+ RPM" } },
      { title: '20L Solo Microwave Oven', cat: 'Appliances & Cooling', rent: 600, deposit: 600, retail: 10000, img: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=500&q=80', attrs: { "Control Type": "Digital Touch" } },
      { title: 'Induction Cooktop', cat: 'Appliances & Cooling', rent: 400, deposit: 400, retail: 5000, img: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=500&q=80', attrs: { "Wattage": "2000W" } },
      { title: 'Compact Air Cooler (40L)', cat: 'Appliances & Cooling', rent: 550, deposit: 550, retail: 9000, img: 'https://images.unsplash.com/photo-1618945596041-aa6d89dfda71?auto=format&fit=crop&w=500&q=80', attrs: { "Cooling Pad": "Honeycomb" } },
      { title: 'Garment Steamer & Iron Press Board', cat: 'Appliances & Cooling', rent: 450, deposit: 450, retail: 7000, img: 'https://images.unsplash.com/photo-1517420812313-8fc1b5b8f30c?auto=format&fit=crop&w=500&q=80', attrs: { "Continuous Steam Rate": "High Flow" } },

      // Electronics & Entertainment
      { title: '43-inch 4K Smart TV', cat: 'Electronics & Entertainment', rent: 1200, deposit: 1200, retail: 35000, img: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=500&q=80', attrs: { "Panel Type": "LED", "Resolution": "4K UHD" } },
      { title: '32-inch LED Smart TV', cat: 'Electronics & Entertainment', rent: 800, deposit: 800, retail: 18000, img: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=500&q=80', attrs: { "Audio Output Wattage": "20W" } },
      { title: '24-inch IPS Monitor', cat: 'Electronics & Entertainment', rent: 600, deposit: 600, retail: 12000, img: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=500&q=80', attrs: { "Refresh Rate": "75Hz" } },
      { title: '27-inch 2K Gaming Monitor', cat: 'Electronics & Entertainment', rent: 1100, deposit: 1100, retail: 28000, img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=500&q=80', attrs: { "Refresh Rate": "144Hz", "Panel Technology": "Fast IPS" } },
      { title: 'Intel i5 / 16GB RAM Laptop', cat: 'Electronics & Entertainment', rent: 2500, deposit: 2500, retail: 65000, img: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=500&q=80', attrs: { "Processor Generation": "12th Gen", "Storage Capacity": "512GB SSD" } },
      { title: 'M-Series MacBook Air', cat: 'Electronics & Entertainment', rent: 3500, deposit: 3500, retail: 95000, img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=80', attrs: { "Chip Model": "M2", "Unified Memory": "16GB" } },
      { title: 'Bluetooth Soundbar with Subwoofer', cat: 'Electronics & Entertainment', rent: 750, deposit: 750, retail: 15000, img: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=500&q=80', attrs: { "Total RMS Wattage": "120W+", "Audio Channels": "2.1" } },
      { title: 'Noise-Canceling Wireless Headphones', cat: 'Electronics & Entertainment', rent: 900, deposit: 900, retail: 25000, img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80', attrs: { "ANC Efficiency": "Premium (35dB+)" } },
      { title: 'Mechanical Gaming Keyboard', cat: 'Electronics & Entertainment', rent: 450, deposit: 450, retail: 8000, img: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=500&q=80', attrs: { "Switch Type": "Red Linear" } },
      { title: 'Ergonomic Vertical Wireless Mouse', cat: 'Electronics & Entertainment', rent: 350, deposit: 350, retail: 5000, img: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=500&q=80', attrs: { "DPI Sensor Sensitivity": "High (4000+)" } },

      // Furniture & Room Layouts
      { title: 'Ergonomic Office Chair', cat: 'Study & Furniture', rent: 550, deposit: 550, retail: 14000, img: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=500&q=80', attrs: { "Adjustment Options": "3D Armrest", "Mesh Type": "Breathable Premium" } },
      { title: 'Wooden Study Desk', cat: 'Study & Furniture', rent: 450, deposit: 450, retail: 10000, img: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=500&q=80', attrs: { "Frame Material": "Steel Frame", "Cable Management": "Yes" } },
      { title: 'Single Solid Wood Bed Frame', cat: 'Study & Furniture', rent: 800, deposit: 800, retail: 22000, img: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=500&q=80', attrs: { "Wood Grain Class": "Premium Teak/Sheesham" } },
      { title: '6-Inch Orthopedic Foam Mattress', cat: 'Study & Furniture', rent: 650, deposit: 650, retail: 16000, img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=500&q=80', attrs: { "Core Layering": "Memory Foam" } },
      { title: '2-Door Wooden Wardrobe', cat: 'Study & Furniture', rent: 950, deposit: 950, retail: 25000, img: 'https://images.unsplash.com/photo-1558882224-cca16673336d?auto=format&fit=crop&w=500&q=80', attrs: { "Internal Locker Safe": "Yes", "Integrated Mirror": "Yes" } },
      { title: '3-Tier Compact Bookshelf', cat: 'Study & Furniture', rent: 350, deposit: 350, retail: 8000, img: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=500&q=80', attrs: { "Weight Capacity per Shelf": "25kg+" } },
      { title: 'Full-Length Dressing Mirror', cat: 'Study & Furniture', rent: 400, deposit: 400, retail: 9000, img: 'https://images.unsplash.com/photo-1617806118233-18e1db207f62?auto=format&fit=crop&w=500&q=80', attrs: { "Support Type": "Floor Stand", "Distortion-Free Glass": "Yes" } },
      { title: 'Adjustable Laptop Table for Bed', cat: 'Study & Furniture', rent: 300, deposit: 300, retail: 5000, img: 'https://images.unsplash.com/photo-1565793298595-6a879990407c?auto=format&fit=crop&w=500&q=80', attrs: { "Tilt Angles Available": "Infinite Adjust" } },
      { title: 'Bean Bag with Beans (XXL)', cat: 'Study & Furniture', rent: 450, deposit: 450, retail: 7000, img: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=500&q=80', attrs: { "Outer Material": "Leatherette", "Bean Fill Volume": "5kg Full" } },
      { title: 'Metal Shoe Rack (4-Tier)', cat: 'Study & Furniture', rent: 300, deposit: 300, retail: 4000, img: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=500&q=80', attrs: { "Pipe Gauge Thickness": "Heavy Duty" } },

      // Lifestyle & Academics
      { title: '65L Trekking Backpack', cat: 'Clothing & Accessories', rent: 600, deposit: 600, retail: 12000, img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=500&q=80', attrs: { "Internal Frame Material": "Aluminum Alloy", "Waterproof Denier Index": "1000D+" } },
      { title: 'Water-Resistant 3-Person Camping Tent', cat: 'Clothing & Accessories', rent: 850, deposit: 850, retail: 18000, img: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=500&q=80', attrs: { "Pole Type": "Aluminum Alloy", "Rainfly Hydrostatic Rating": "3000mm+" } },
      { title: 'Engineering Graphics Drawing Board (A1)', cat: 'Clothing & Accessories', rent: 400, deposit: 400, retail: 6000, img: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=500&q=80', attrs: { "Wood Smoothness Grade": "Class A+ Super Smooth" } },
    ];

    for (const item of items) {
      const itemInsert = await client.query(`
        INSERT INTO items (seller_id, title, description, category_id, city_id, monthly_rent, deposit_amount, retail_price, sub_attributes, status, is_available)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', true)
        RETURNING id
      `, [sellerId, item.title, `High quality ${item.title} for student rental.`, categories[item.cat], cities['Kanpur'], item.rent, item.deposit, item.retail, JSON.stringify(item.attrs)]);
      
      const itemId = itemInsert.rows[0].id;
      await client.query(`
        INSERT INTO item_images (item_id, image_url, is_primary, alt_text)
        VALUES ($1, $2, true, $3)
      `, [itemId, item.img, item.title]);
    }

    console.log('Database seeded successfully!');
    console.log('Test Accounts:');
    console.log('Seller: seller@example.com / password123');
    console.log('Renter: renter@example.com / password123');

  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
