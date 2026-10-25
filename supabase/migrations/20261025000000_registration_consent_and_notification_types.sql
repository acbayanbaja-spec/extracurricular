-- 2026-10-25: Registration consent form (learner personal info + guardian details)
-- and notification type compatibility patch. Mirrors ensureLiveSchema() in the
-- embedded serverless API so both managed and direct SQL setups stay identical.

ALTER TABLE registrations ADD COLUMN IF NOT EXISTS participant_name VARCHAR(150);
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS contact_number VARCHAR(32);
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(128);
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS guardian_relationship VARCHAR(64);
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS guardian_contact VARCHAR(64);
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS guardian_consent BOOLEAN DEFAULT FALSE;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS medical_notes TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS motivation TEXT;

-- Allow the notification categories used across the API (info/success/warning)
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN ('registration', 'attendance', 'achievement', 'badge', 'certificate', 'announcement', 'system', 'info', 'success', 'warning'));
