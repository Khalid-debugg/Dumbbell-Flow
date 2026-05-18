-- UP

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount REAL NOT NULL CHECK(amount > 0),
  date TEXT NOT NULL,
  description TEXT,
  payment_method TEXT CHECK(payment_method IN ('cash', 'card', 'transfer', 'e-wallet')),
  reference TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

CREATE TRIGGER IF NOT EXISTS trg_transactions_updated_at
AFTER UPDATE ON transactions
BEGIN
  UPDATE transactions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- DOWN

DROP TRIGGER IF EXISTS trg_transactions_updated_at;
DROP INDEX IF EXISTS idx_transactions_category;
DROP INDEX IF EXISTS idx_transactions_date;
DROP INDEX IF EXISTS idx_transactions_type;
DROP TABLE IF EXISTS transactions;
