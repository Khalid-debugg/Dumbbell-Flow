-- UP
-- Migration: Fix WhatsApp message template to English
UPDATE settings
SET whatsapp_message_template = 'Hello {name}, your membership at {gym_name} will expire in {days_left} days on {end_date}. Please renew to continue using the gym.'
WHERE id = '1';

-- DOWN
UPDATE settings
SET whatsapp_message_template = 'مرحباً {name}، عضويتك في {gym_name} ستنتهي في {days_left} أيام بتاريخ {end_date}. يرجى التجديد للاستمرار في استخدام النادي.'
WHERE id = '1';
