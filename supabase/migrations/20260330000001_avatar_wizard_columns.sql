-- ============================================================
-- Chibi Creator — Avatar Wizard Columns
-- Migration: 20260330000001_avatar_wizard_columns.sql
-- ============================================================

-- Add avatar_wizard_data column to generations for storing wizard step data
ALTER TABLE generations ADD COLUMN IF NOT EXISTS
  avatar_data JSONB DEFAULT NULL;

COMMENT ON COLUMN generations.avatar_data IS
  'Stores avatar wizard step data: {gender, skinTone, hairColor, hairLength, eyeColor, profession, style, background}';
