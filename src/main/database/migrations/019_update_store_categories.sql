-- UP
-- SQLite can't ALTER a CHECK constraint, so recreate the table with updated categories.
-- Also remaps any existing 'bars' rows to 'meals'.

CREATE TABLE IF NOT EXISTS store_products_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('drinks', 'meals', 'supplements', 'apparel', 'essentials', 'other')),
  price REAL NOT NULL CHECK (price >= 0),
  cost_price REAL NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO store_products_new
  SELECT
    id, name, description,
    CASE WHEN category = 'bars' THEN 'meals' ELSE category END,
    price, cost_price, stock_quantity, created_at, updated_at
  FROM store_products;

DROP TABLE store_products;

ALTER TABLE store_products_new RENAME TO store_products;

CREATE INDEX IF NOT EXISTS idx_store_products_category ON store_products(category);
CREATE INDEX IF NOT EXISTS idx_store_products_is_active ON store_products(is_active);

CREATE TRIGGER IF NOT EXISTS trg_store_products_updated_at
AFTER UPDATE ON store_products
BEGIN
  UPDATE store_products
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

-- DOWN
-- (no-op: cannot safely restore old CHECK constraint without data loss)
SELECT 1;
