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

  cloud_backup_enabled INTEGER DEFAULT 0 CHECK (cloud_backup_enabled IN (0, 1)),
  cloud_backup_api_url TEXT,
  last_cloud_backup_date DATETIME,

  whatsapp_enabled INTEGER DEFAULT 1 CHECK (whatsapp_enabled IN (0, 1)),
  whatsapp_auto_send INTEGER DEFAULT 1 CHECK (whatsapp_auto_send IN (0, 1)),
  whatsapp_days_before_expiry INTEGER DEFAULT 3,
  whatsapp_message_template TEXT DEFAULT 'Hello {name}, your membership at {gym_name} will expire in {days_left} days on {end_date}. Please renew to continue using the gym.',
  whatsapp_last_check_date DATETIME,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS trg_settings_updated_at
AFTER UPDATE ON settings
BEGIN
  UPDATE settings
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY AUTOINCREMENT,
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

CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
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
  is_paused INTEGER DEFAULT 0 CHECK (is_paused IN (0, 1)),
  paused_date DATE,
  original_end_date DATE,
  pause_duration_days INTEGER,
  remaining_days_before_pause INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES membership_plans(id) ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS check_ins (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS membership_payments (
  id TEXT PRIMARY KEY,
  membership_id TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer', 'e-wallet')),
  payment_date DATE NOT NULL,
  payment_status TEXT DEFAULT 'completed' CHECK (payment_status IN ('completed', 'scheduled', 'pending')),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE CASCADE ON UPDATE CASCADE
);

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

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  is_admin INTEGER NOT NULL DEFAULT 0 CHECK (is_admin IN (0, 1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  permissions TEXT NOT NULL DEFAULT '{}',
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS trg_users_updated_at
AFTER UPDATE ON users
BEGIN
  UPDATE users
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_reports_dates ON reports(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_memberships_member_id ON memberships(member_id);
CREATE INDEX IF NOT EXISTS idx_memberships_payment_status ON memberships(payment_status);
CREATE INDEX IF NOT EXISTS idx_memberships_is_paused ON memberships(is_paused);
CREATE INDEX IF NOT EXISTS idx_check_ins_member_id ON check_ins(member_id);
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);
CREATE INDEX IF NOT EXISTS idx_check_ins_member_date ON check_ins(member_id, DATE(check_in_time));
CREATE INDEX IF NOT EXISTS idx_membership_payments_membership_id ON membership_payments(membership_id);

CREATE TABLE IF NOT EXISTS whatsapp_notifications (
  id TEXT PRIMARY KEY,
  membership_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_date DATETIME NOT NULL,
  days_before_expiry INTEGER NOT NULL,
  expiry_date DATE NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_membership ON whatsapp_notifications(membership_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_member ON whatsapp_notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_sent_date ON whatsapp_notifications(sent_date);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_expiry ON whatsapp_notifications(expiry_date);

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

-- Insert default admin user (password: admin123)
-- Password hash is SHA256 hash of 'admin123'
INSERT OR IGNORE INTO users (
  id,
  username,
  password_hash,
  full_name,
  email,
  is_admin,
  is_active,
  permissions
) VALUES (
  'admin_default',
  'admin',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  'System Administrator',
  NULL,
  1,
  1,
  '{}'
);

