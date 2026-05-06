-- UP
-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY CHECK (id = '1'),

  language TEXT DEFAULT 'ar' CHECK (language IN ('ar', 'en', 'es', 'pt', 'fr', 'de')),
  currency TEXT DEFAULT 'EGP',

  gym_name TEXT DEFAULT 'DumbbellFlow Gym',
  gym_address TEXT,
  gym_country_code TEXT DEFAULT '+20',
  gym_phone TEXT,
  gym_logo_path TEXT,
  barcode_size TEXT DEFAULT 'keychain' CHECK (barcode_size IN ('keychain', 'card')),

  allowed_genders TEXT DEFAULT 'both' CHECK (allowed_genders IN ('male', 'female', 'both')),

  default_payment_method TEXT DEFAULT 'cash' CHECK (default_payment_method IN ('cash', 'card', 'transfer', 'e-wallet')),

  auto_backup INTEGER DEFAULT 1 CHECK (auto_backup IN (0, 1)),
  backup_frequency TEXT DEFAULT 'daily' CHECK (backup_frequency IN ('daily', 'weekly', 'monthly')),
  backup_folder_path TEXT,
  last_backup_date DATETIME,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create settings update trigger
CREATE TRIGGER IF NOT EXISTS trg_settings_updated_at
AFTER UPDATE ON settings
BEGIN
  UPDATE settings
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

-- Create members table
CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  country_code TEXT DEFAULT '+20',
  phone TEXT NOT NULL UNIQUE,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  address TEXT,
  join_date DATE NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create membership_plans table
CREATE TABLE IF NOT EXISTS membership_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  is_offer INTEGER NOT NULL CHECK (is_offer IN (0, 1)),
  duration_days INTEGER,
  plan_type TEXT DEFAULT 'duration' CHECK (plan_type IN ('duration', 'checkin')),
  check_in_limit INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create memberships table
CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,
  member_id INTEGER NOT NULL,
  plan_id TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_price REAL NOT NULL,
  amount_paid REAL NOT NULL,
  remaining_balance REAL NOT NULL DEFAULT 0,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  payment_method TEXT NOT NULL,
  payment_date DATE NOT NULL,
  remaining_check_ins INTEGER,
  is_custom INTEGER DEFAULT 0 CHECK (is_custom IN (0, 1)),
  price_modifier_type TEXT CHECK (price_modifier_type IN ('multiplier', 'discount', 'custom', NULL)),
  price_modifier_value REAL,
  custom_price_name TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES membership_plans(id)
);

-- Create check_ins table
CREATE TABLE IF NOT EXISTS check_ins (
  id TEXT PRIMARY KEY,
  member_id INTEGER NOT NULL,
  check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Create membership_payments table
CREATE TABLE IF NOT EXISTS membership_payments (
  id TEXT PRIMARY KEY,
  membership_id TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer', 'e-wallet')),
  payment_date DATE NOT NULL,
  payment_status TEXT DEFAULT 'completed' CHECK (payment_status IN ('completed', 'scheduled', 'pending')),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE CASCADE
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  report_type TEXT NOT NULL CHECK (report_type IN ('week', 'month', 'year', 'custom')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_revenue REAL NOT NULL,
  total_members INTEGER NOT NULL,
  new_members INTEGER NOT NULL,
  total_memberships INTEGER NOT NULL,
  new_memberships INTEGER NOT NULL,
  total_check_ins INTEGER NOT NULL,
  generated_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reports_dates ON reports(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_memberships_member_id ON memberships(member_id);
CREATE INDEX IF NOT EXISTS idx_memberships_payment_status ON memberships(payment_status);
CREATE INDEX IF NOT EXISTS idx_check_ins_member_id ON check_ins(member_id);
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);
CREATE INDEX IF NOT EXISTS idx_check_ins_member_date ON check_ins(member_id, DATE(check_in_time));
CREATE INDEX IF NOT EXISTS idx_membership_payments_membership_id ON membership_payments(membership_id);

-- Insert default settings
INSERT OR IGNORE INTO settings (
  id,
  language,
  currency,
  gym_name,
  allowed_genders,
  default_payment_method,
  auto_backup,
  backup_frequency,
  last_backup_date
) VALUES (
  '1',
  'ar',
  'EGP',
  'DumbbellFlow Gym',
  'both',
  'cash',
  1,
  'daily',
  CURRENT_TIMESTAMP
);

-- DOWN
-- Drop all indexes
DROP INDEX IF EXISTS idx_membership_payments_membership_id;
DROP INDEX IF EXISTS idx_check_ins_member_date;
DROP INDEX IF EXISTS idx_members_phone;
DROP INDEX IF EXISTS idx_check_ins_member_id;
DROP INDEX IF EXISTS idx_memberships_payment_status;
DROP INDEX IF EXISTS idx_memberships_member_id;
DROP INDEX IF EXISTS idx_reports_type;
DROP INDEX IF EXISTS idx_reports_dates;

-- Drop all tables
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS membership_payments;
DROP TABLE IF EXISTS check_ins;
DROP TABLE IF EXISTS memberships;
DROP TABLE IF EXISTS membership_plans;
DROP TABLE IF EXISTS members;

-- Drop triggers
DROP TRIGGER IF EXISTS trg_settings_updated_at;

-- Drop settings table
DROP TABLE IF EXISTS settings;
