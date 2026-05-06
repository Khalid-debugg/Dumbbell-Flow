-- UP
-- SQLite doesn't support modifying CHECK constraints directly
-- We need to recreate the settings table with the new constraint

-- Step 1: Create a new settings table with updated language constraint
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

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Copy all data from old table to new table
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

-- Step 3: Drop the old table
DROP TABLE settings;

-- Step 4: Rename new table to settings
ALTER TABLE settings_new RENAME TO settings;

-- Step 5: Recreate the trigger
CREATE TRIGGER IF NOT EXISTS trg_settings_updated_at
AFTER UPDATE ON settings
BEGIN
  UPDATE settings
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

-- DOWN
-- Revert back to only allowing 'ar' and 'en'
CREATE TABLE IF NOT EXISTS settings_old (
  id TEXT PRIMARY KEY CHECK (id = '1'),

  language TEXT DEFAULT 'ar' CHECK (language IN ('ar', 'en')),
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
