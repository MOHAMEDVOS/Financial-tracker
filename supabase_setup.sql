-- Run this SQL in your Supabase SQL Editor to RE-CREATE the table correctly
-- IMPORTANT: This will delete existing data in the cloud table if any.

DROP TABLE IF EXISTS wedding_data;

CREATE TABLE wedding_data (
  id bigint PRIMARY KEY DEFAULT 1,
  monthly_income numeric,
  monthly_savings numeric,
  balance numeric,
  total_budget numeric,
  categories jsonb,
  payments jsonb,
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE wedding_data ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all access
CREATE POLICY "Allow all access" ON wedding_data FOR ALL USING (true);

-- Insert the initial record
INSERT INTO wedding_data (id, monthly_income, monthly_savings, balance, total_budget, categories, payments)
VALUES (1, 0, 0, 0, 0, '[]', '[]');
