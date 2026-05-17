-- UP

ALTER TABLE class_instances ADD COLUMN price_per_class REAL;
ALTER TABLE class_instances ADD COLUMN price_per_week REAL;
ALTER TABLE class_instances ADD COLUMN price_per_month REAL;
ALTER TABLE class_instances ADD COLUMN price_per_year REAL;

-- DOWN

ALTER TABLE class_instances DROP COLUMN price_per_year;
ALTER TABLE class_instances DROP COLUMN price_per_month;
ALTER TABLE class_instances DROP COLUMN price_per_week;
ALTER TABLE class_instances DROP COLUMN price_per_class;
