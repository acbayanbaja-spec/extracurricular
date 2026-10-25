-- 2026-10-25: Attendance presence is recorded for every registered learner, but growth
-- points only post once their adviser approves the registration. This flag marks whether a
-- check-in has already been credited so approval can release held points exactly once.
-- Mirrors ensureLiveSchema() in the embedded serverless API.

ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS points_credited BOOLEAN NOT NULL DEFAULT FALSE;
