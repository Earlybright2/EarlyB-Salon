/*
# Create AI Try-On tables

1. New Tables
- `hairstyles` — catalog of hairstyles available for try-on
  - id (uuid, primary key)
  - name (text, not null)
  - category (text, not null) — e.g. "Braids", "Fade", "Natural"
  - asset_url (text, not null) — URL to the hairstyle sprite/overlay image
  - face_shapes (text[]) — compatible face shapes (oval, round, square, heart, diamond, oblong)
  - gender_target (text) — male, female, unisex
  - trend_score (integer) — popularity ranking
  - is_active (boolean, default true)
  - created_at (timestamptz)
- `try_on_results` — saved try-on results from users
  - id (uuid, primary key)
  - user_id (text, optional) — optional identifier for the user (no auth required)
  - hairstyle_id (uuid, foreign key to hairstyles)
  - result_image_url (text) — URL or path to the rendered result image
  - face_shape (text) — detected face shape
  - created_at (timestamptz)

2. Security
- Enable RLS on both tables.
- Hairstyles: public read (anon + authenticated), no writes from client.
- Try-on results: anon + authenticated can insert and read (single-tenant, no auth required for MVP).
*/

CREATE TABLE IF NOT EXISTS hairstyles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  asset_url text NOT NULL,
  face_shapes text[] DEFAULT '{}',
  gender_target text DEFAULT 'unisex',
  trend_score integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE hairstyles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_hairstyles" ON hairstyles;
CREATE POLICY "anon_select_hairstyles" ON hairstyles FOR SELECT
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS try_on_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  hairstyle_id uuid REFERENCES hairstyles(id) ON DELETE SET NULL,
  result_image_url text,
  face_shape text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE try_on_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_tryon" ON try_on_results;
CREATE POLICY "anon_select_tryon" ON try_on_results FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_tryon" ON try_on_results;
CREATE POLICY "anon_insert_tryon" ON try_on_results FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_tryon" ON try_on_results;
CREATE POLICY "anon_delete_tryon" ON try_on_results FOR DELETE
  TO anon, authenticated USING (true);
