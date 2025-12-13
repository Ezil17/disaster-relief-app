-- Create tables for ReliefTrack system

-- Inventory table for relief supplies
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('food_pack', 'hygiene_kit', 'medical', 'clothing', 'other')),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit TEXT NOT NULL DEFAULT 'pcs',
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Households table for beneficiary registration
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_number TEXT NOT NULL UNIQUE,
  head_of_family TEXT NOT NULL,
  purok TEXT NOT NULL,
  address TEXT NOT NULL,
  contact_number TEXT,
  family_members INTEGER NOT NULL CHECK (family_members > 0),
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Distributions table to track relief distribution
CREATE TABLE IF NOT EXISTS distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  quantity_distributed INTEGER NOT NULL CHECK (quantity_distributed > 0),
  distributed_by TEXT NOT NULL,
  distributed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_households_purok ON households(purok);
CREATE INDEX IF NOT EXISTS idx_households_household_number ON households(household_number);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_distributions_household_id ON distributions(household_id);
CREATE INDEX IF NOT EXISTS idx_distributions_inventory_id ON distributions(inventory_id);

-- Enable Row Level Security (RLS)
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on auth requirements)
-- For now, allowing all operations for simplicity
CREATE POLICY "Allow all operations on inventory" ON inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on households" ON households FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on distributions" ON distributions FOR ALL USING (true) WITH CHECK (true);
