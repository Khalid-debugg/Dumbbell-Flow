-- UP
ALTER TABLE store_products ADD COLUMN expiry_date TEXT;

-- DOWN
-- SQLite does not support DROP COLUMN in older versions; handled by re-creating the table if needed
