-- =============================================
-- Medi-Remind Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- =============================================

-- Profiles (one user can have many profiles, e.g. Mom, Dad)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'bg-blue-500',
  preferred_language_code TEXT DEFAULT 'en',
  preferred_voice_id TEXT DEFAULT 'Kore',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Medications per profile
CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT now()
);

-- Reminders per profile
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  medicine_name TEXT NOT NULL,
  dosage TEXT,
  time TEXT NOT NULL,
  active BOOLEAN DEFAULT true
);

-- Scan history with image reference
CREATE TABLE scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  profile_name TEXT,
  medicine_name TEXT NOT NULL,
  analysis JSONB NOT NULL,
  image_path TEXT,
  scanned_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Row Level Security (each user only sees their own data)
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;

-- Profiles: users can CRUD their own
CREATE POLICY "Users manage own profiles" ON profiles
  FOR ALL USING (auth.uid() = user_id);

-- Medications: users can CRUD meds on their own profiles
CREATE POLICY "Users manage own medications" ON medications
  FOR ALL USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Reminders: users can CRUD reminders on their own profiles
CREATE POLICY "Users manage own reminders" ON reminders
  FOR ALL USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Scan history: users can CRUD their own scan entries
CREATE POLICY "Users manage own scans" ON scan_history
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- Storage bucket for medicine images
-- Create this via Dashboard → Storage → New Bucket
-- Name: medicine-images
-- Public: false (use signed URLs)
-- =============================================
