-- UP
-- Migration: Add WhatsApp notification system
-- Description: Adds WhatsApp notification configuration and tracking table

CREATE TABLE IF NOT EXISTS settings_new (
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

  allow_instant_checkin INTEGER DEFAULT 0 CHECK (allow_instant_checkin IN (0, 1)),

  auto_backup INTEGER DEFAULT 1 CHECK (auto_backup IN (0, 1)),
  backup_frequency TEXT DEFAULT 'daily' CHECK (backup_frequency IN ('daily', 'weekly', 'monthly')),
  backup_folder_path TEXT,
  last_backup_date DATETIME,

  whatsapp_enabled INTEGER DEFAULT 0 CHECK (whatsapp_enabled IN (0, 1)),
  whatsapp_auto_send INTEGER DEFAULT 0 CHECK (whatsapp_auto_send IN (0, 1)),
  whatsapp_days_before_expiry INTEGER DEFAULT 3,
  whatsapp_message_template TEXT DEFAULT 'Hello {name}, your membership at {gym_name} will expire in {days_left} days on {end_date}. Please renew to continue using the gym.',
  whatsapp_last_check_date DATETIME,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO settings_new (
  id,
  language,
  currency,
  gym_name,
  gym_address,
  gym_country_code,
  gym_phone,
  gym_logo_path,
  barcode_size,
  allowed_genders,
  default_payment_method,
  allow_instant_checkin,
  auto_backup,
  backup_frequency,
  backup_folder_path,
  last_backup_date,
  created_at,
  updated_at
)
SELECT
  id,
  language,
  currency,
  gym_name,
  gym_address,
  gym_country_code,
  gym_phone,
  gym_logo_path,
  barcode_size,
  allowed_genders,
  default_payment_method,
  allow_instant_checkin,
  auto_backup,
  backup_frequency,
  backup_folder_path,
  last_backup_date,
  created_at,
  updated_at
FROM settings;

DROP TABLE settings;
ALTER TABLE settings_new RENAME TO settings;

CREATE TRIGGER IF NOT EXISTS trg_settings_updated_at
AFTER UPDATE ON settings
BEGIN
  UPDATE settings
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

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
  FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_membership ON whatsapp_notifications(membership_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_member ON whatsapp_notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_sent_date ON whatsapp_notifications(sent_date);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_expiry ON whatsapp_notifications(expiry_date);

-- DOWN
DROP INDEX IF EXISTS idx_whatsapp_notifications_expiry;
DROP INDEX IF EXISTS idx_whatsapp_notifications_sent_date;
DROP INDEX IF EXISTS idx_whatsapp_notifications_member;
DROP INDEX IF EXISTS idx_whatsapp_notifications_membership;
DROP TABLE IF EXISTS whatsapp_notifications;

CREATE TABLE IF NOT EXISTS settings_old (
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

  allow_instant_checkin INTEGER DEFAULT 0 CHECK (allow_instant_checkin IN (0, 1)),

  auto_backup INTEGER DEFAULT 1 CHECK (auto_backup IN (0, 1)),
  backup_frequency TEXT DEFAULT 'daily' CHECK (backup_frequency IN ('daily', 'weekly', 'monthly')),
  backup_folder_path TEXT,
  last_backup_date DATETIME,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO settings_old (
  id,
  language,
  currency,
  gym_name,
  gym_address,
  gym_country_code,
  gym_phone,
  gym_logo_path,
  barcode_size,
  allowed_genders,
  default_payment_method,
  allow_instant_checkin,
  auto_backup,
  backup_frequency,
  backup_folder_path,
  last_backup_date,
  created_at,
  updated_at
)
SELECT
  id,
  language,
  currency,
  gym_name,
  gym_address,
  gym_country_code,
  gym_phone,
  gym_logo_path,
  barcode_size,
  allowed_genders,
  default_payment_method,
  allow_instant_checkin,
  auto_backup,
  backup_frequency,
  backup_folder_path,
  last_backup_date,
  created_at,
  updated_at
FROM settings;

DROP TABLE settings;
ALTER TABLE settings_old RENAME TO settings;

CREATE TRIGGER IF NOT EXISTS trg_settings_updated_at
AFTER UPDATE ON settings
BEGIN
  UPDATE settings
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;
