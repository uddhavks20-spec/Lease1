-- Seed: 1 item per category for Lease marketplace
-- Run this in Neon SQL Editor

DO $$
DECLARE
  v_seller_id UUID;
  v_role_id UUID;
  v_city_id UUID;
  v_cat_id UUID;
  v_item_id UUID;
BEGIN

  -- Get seller role
  SELECT id INTO v_role_id FROM roles WHERE name = 'seller' LIMIT 1;

  -- Create demo seller if not exists
  INSERT INTO users (email, password_hash, first_name, last_name, role_id, is_verified)
  VALUES (
    'seller@demo.com',
    '$2a$10$dummyhashdonotuse',
    'Demo',
    'Seller',
    v_role_id,
    true
  )
  ON CONFLICT (email) DO NOTHING;

  SELECT id INTO v_seller_id FROM users WHERE email = 'seller@demo.com';

  -- Get Kanpur city
  SELECT id INTO v_city_id FROM cities WHERE name = 'Kanpur' LIMIT 1;

  -- Clean existing items
  DELETE FROM item_images;
  DELETE FROM items;

  -- Electronics
  SELECT id INTO v_cat_id FROM categories WHERE name = 'Electronics' LIMIT 1;
  INSERT INTO items (seller_id, title, description, category_id, city_id, monthly_rent, deposit_amount, status, is_available)
  VALUES (v_seller_id, 'MacBook Pro M2 14"', 'High-performance laptop perfect for coding, design, and entertainment.', v_cat_id, v_city_id, 2500, 2500, 'active', true)
  RETURNING id INTO v_item_id;
  INSERT INTO item_images (item_id, image_url, is_primary, alt_text)
  VALUES (v_item_id, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=80', true, 'MacBook Pro');

  -- Furniture
  SELECT id INTO v_cat_id FROM categories WHERE name = 'Furniture' LIMIT 1;
  INSERT INTO items (seller_id, title, description, category_id, city_id, monthly_rent, deposit_amount, status, is_available)
  VALUES (v_seller_id, 'Ergonomic Office Chair', 'Comfortable mesh back chair with lumbar support. Perfect for long study sessions.', v_cat_id, v_city_id, 550, 550, 'active', true)
  RETURNING id INTO v_item_id;
  INSERT INTO item_images (item_id, image_url, is_primary, alt_text)
  VALUES (v_item_id, 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=500&q=80', true, 'Office Chair');

  -- Books
  SELECT id INTO v_cat_id FROM categories WHERE name = 'Books' LIMIT 1;
  INSERT INTO items (seller_id, title, description, category_id, city_id, monthly_rent, deposit_amount, status, is_available)
  VALUES (v_seller_id, 'Engineering Mathematics Bundle', 'Complete set of engineering mathematics textbooks.', v_cat_id, v_city_id, 200, 500, 'active', true)
  RETURNING id INTO v_item_id;
  INSERT INTO item_images (item_id, image_url, is_primary, alt_text)
  VALUES (v_item_id, 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=500&q=80', true, 'Books Bundle');

  -- Sports
  SELECT id INTO v_cat_id FROM categories WHERE name = 'Sports' LIMIT 1;
  INSERT INTO items (seller_id, title, description, category_id, city_id, monthly_rent, deposit_amount, status, is_available)
  VALUES (v_seller_id, 'Badminton Racket Set', 'Professional grade badminton set with 2 rackets and shuttlecocks.', v_cat_id, v_city_id, 300, 500, 'active', true)
  RETURNING id INTO v_item_id;
  INSERT INTO item_images (item_id, image_url, is_primary, alt_text)
  VALUES (v_item_id, 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=500&q=80', true, 'Badminton Set');

  -- Kitchen
  SELECT id INTO v_cat_id FROM categories WHERE name = 'Kitchen' LIMIT 1;
  INSERT INTO items (seller_id, title, description, category_id, city_id, monthly_rent, deposit_amount, status, is_available)
  VALUES (v_seller_id, 'Induction Cooktop 2000W', 'Portable induction cooktop with 8 power levels and automatic shut-off.', v_cat_id, v_city_id, 400, 400, 'active', true)
  RETURNING id INTO v_item_id;
  INSERT INTO item_images (item_id, image_url, is_primary, alt_text)
  VALUES (v_item_id, 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=500&q=80', true, 'Induction Cooktop');

  -- Clothing
  SELECT id INTO v_cat_id FROM categories WHERE name = 'Clothing' LIMIT 1;
  INSERT INTO items (seller_id, title, description, category_id, city_id, monthly_rent, deposit_amount, status, is_available)
  VALUES (v_seller_id, 'Premium Winter Jacket', 'Warm insulated winter jacket. Perfect for cold campus mornings. Size M.', v_cat_id, v_city_id, 500, 1000, 'active', true)
  RETURNING id INTO v_item_id;
  INSERT INTO item_images (item_id, image_url, is_primary, alt_text)
  VALUES (v_item_id, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=500&q=80', true, 'Winter Jacket');

  -- Other
  SELECT id INTO v_cat_id FROM categories WHERE name = 'Other' LIMIT 1;
  INSERT INTO items (seller_id, title, description, category_id, city_id, monthly_rent, deposit_amount, status, is_available)
  VALUES (v_seller_id, 'Acoustic Guitar Beginner', '6-string acoustic guitar perfect for beginners. Includes carrying case.', v_cat_id, v_city_id, 350, 800, 'active', true)
  RETURNING id INTO v_item_id;
  INSERT INTO item_images (item_id, image_url, is_primary, alt_text)
  VALUES (v_item_id, 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=500&q=80', true, 'Acoustic Guitar');

  RAISE NOTICE 'Done! 1 item seeded per category';
END $$;
