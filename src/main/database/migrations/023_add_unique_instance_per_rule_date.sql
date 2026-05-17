-- UP

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_recurring_instance
ON class_instances(rule_id, scheduled_date)
WHERE rule_id IS NOT NULL;

-- DOWN

DROP INDEX IF EXISTS idx_unique_recurring_instance;
