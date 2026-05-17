-- UP

ALTER TABLE class_rules ADD COLUMN start_time TEXT;
ALTER TABLE class_instances ADD COLUMN start_time TEXT;

-- DOWN

ALTER TABLE class_rules DROP COLUMN start_time;
ALTER TABLE class_instances DROP COLUMN start_time;
