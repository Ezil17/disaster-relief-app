-- Seed initial inventory data
INSERT INTO inventory (item_name, category, quantity, unit, low_stock_threshold) VALUES
('Rice Pack (5kg)', 'food_pack', 150, 'pcs', 20),
('Canned Goods Assortment', 'food_pack', 200, 'pcs', 30),
('Instant Noodles Pack', 'food_pack', 300, 'pcs', 50),
('Hygiene Kit Basic', 'hygiene_kit', 100, 'pcs', 15),
('Soap and Shampoo Set', 'hygiene_kit', 120, 'pcs', 20),
('Sanitary Napkins', 'hygiene_kit', 80, 'pcs', 15),
('First Aid Kit', 'medical', 50, 'pcs', 10),
('Face Masks (Box of 50)', 'medical', 60, 'boxes', 10),
('Blankets', 'clothing', 75, 'pcs', 15),
('Clothing Pack (Assorted)', 'clothing', 90, 'pcs', 20),
('Drinking Water (5L)', 'other', 250, 'bottles', 40),
('Flashlight with Batteries', 'other', 45, 'pcs', 10)
ON CONFLICT DO NOTHING;

-- Seed sample household data
INSERT INTO households (household_number, head_of_family, purok, address, contact_number, family_members) VALUES
('HH-2024-001', 'Juan Dela Cruz', 'Purok 1', '123 Main Street, Barangay Central', '09171234567', 5),
('HH-2024-002', 'Maria Santos', 'Purok 1', '456 Side Street, Barangay Central', '09181234567', 4),
('HH-2024-003', 'Pedro Reyes', 'Purok 2', '789 Hill Road, Barangay Central', '09191234567', 6),
('HH-2024-004', 'Ana Garcia', 'Purok 2', '321 River Street, Barangay Central', '09201234567', 3),
('HH-2024-005', 'Jose Mercado', 'Purok 3', '654 Lake Avenue, Barangay Central', '09211234567', 7),
('HH-2024-006', 'Carmen Cruz', 'Purok 3', '987 Valley Street, Barangay Central', '09221234567', 4),
('HH-2024-007', 'Roberto Lim', 'Purok 4', '147 Mountain Road, Barangay Central', '09231234567', 5),
('HH-2024-008', 'Sofia Reyes', 'Purok 4', '258 Coastal Drive, Barangay Central', '09241234567', 6)
ON CONFLICT DO NOTHING;
