-- UP

CREATE TABLE IF NOT EXISTS class_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  coach_name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  price_per_class REAL,
  price_per_week REAL,
  price_per_month REAL,
  price_per_year REAL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS class_rule_days (
  id TEXT PRIMARY KEY,
  rule_id TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  FOREIGN KEY (rule_id) REFERENCES class_rules(id) ON DELETE CASCADE,
  UNIQUE (rule_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS class_instances (
  id TEXT PRIMARY KEY,
  rule_id TEXT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  coach_name TEXT NOT NULL,
  scheduled_date TEXT NOT NULL,
  day_of_week INTEGER,
  is_recurring INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rule_id) REFERENCES class_rules(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS class_subscribers (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  rule_id TEXT,
  instance_id TEXT,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('per_class', 'per_week', 'per_month', 'per_year')),
  amount REAL NOT NULL,
  amount_paid REAL NOT NULL DEFAULT 0,
  is_partial_payment INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  FOREIGN KEY (rule_id) REFERENCES class_rules(id) ON DELETE CASCADE,
  FOREIGN KEY (instance_id) REFERENCES class_instances(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_class_rule_days_rule ON class_rule_days(rule_id);
CREATE INDEX IF NOT EXISTS idx_class_instances_date ON class_instances(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_class_instances_rule ON class_instances(rule_id);
CREATE INDEX IF NOT EXISTS idx_class_subscribers_member ON class_subscribers(member_id);
CREATE INDEX IF NOT EXISTS idx_class_subscribers_rule ON class_subscribers(rule_id);
CREATE INDEX IF NOT EXISTS idx_class_subscribers_instance ON class_subscribers(instance_id);

CREATE TRIGGER IF NOT EXISTS update_class_rules_timestamp
AFTER UPDATE ON class_rules BEGIN
  UPDATE class_rules SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_class_instances_timestamp
AFTER UPDATE ON class_instances BEGIN
  UPDATE class_instances SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- DOWN

DROP TRIGGER IF EXISTS update_class_instances_timestamp;
DROP TRIGGER IF EXISTS update_class_rules_timestamp;
DROP TABLE IF EXISTS class_subscribers;
DROP TABLE IF EXISTS class_instances;
DROP TABLE IF EXISTS class_rule_days;
DROP TABLE IF EXISTS class_rules;
