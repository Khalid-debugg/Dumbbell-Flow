-- UP

-- Store products catalog
CREATE TABLE IF NOT EXISTS store_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('drinks', 'bars', 'supplements', 'apparel', 'other')),
  price REAL NOT NULL CHECK (price >= 0),
  cost_price REAL NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Store sales (transaction header)
CREATE TABLE IF NOT EXISTS store_sales (
  id TEXT PRIMARY KEY,
  member_id TEXT,
  total_amount REAL NOT NULL CHECK (total_amount >= 0),
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer', 'e-wallet')),
  notes TEXT,
  sold_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
);

-- Store sale line items (one row per product per sale)
CREATE TABLE IF NOT EXISTS store_sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price REAL NOT NULL CHECK (unit_price >= 0),
  subtotal REAL NOT NULL CHECK (subtotal >= 0),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES store_sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES store_products(id)
);

-- Add store_revenue column to reports for breakdown tracking
ALTER TABLE reports ADD COLUMN store_revenue REAL NOT NULL DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_store_products_category ON store_products(category);
CREATE INDEX IF NOT EXISTS idx_store_products_is_active ON store_products(is_active);
CREATE INDEX IF NOT EXISTS idx_store_sales_member_id ON store_sales(member_id);
CREATE INDEX IF NOT EXISTS idx_store_sales_sold_at ON store_sales(sold_at);
CREATE INDEX IF NOT EXISTS idx_store_sale_items_sale_id ON store_sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_store_sale_items_product_id ON store_sale_items(product_id);

-- Trigger: keep updated_at fresh on store_products
CREATE TRIGGER IF NOT EXISTS trg_store_products_updated_at
AFTER UPDATE ON store_products
BEGIN
  UPDATE store_products
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

-- DOWN
DROP TRIGGER IF EXISTS trg_store_products_updated_at;
DROP INDEX IF EXISTS idx_store_sale_items_product_id;
DROP INDEX IF EXISTS idx_store_sale_items_sale_id;
DROP INDEX IF EXISTS idx_store_sales_sold_at;
DROP INDEX IF EXISTS idx_store_sales_member_id;
DROP INDEX IF EXISTS idx_store_products_is_active;
DROP INDEX IF EXISTS idx_store_products_category;
DROP TABLE IF EXISTS store_sale_items;
DROP TABLE IF EXISTS store_sales;
DROP TABLE IF EXISTS store_products;
