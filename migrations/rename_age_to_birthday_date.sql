-- Rename age column to birthday_date and change its type to date
ALTER TABLE users 
  ADD COLUMN birthday_date DATE;

-- Update birthday_date based on existing age (approximately)
-- This is just a placeholder; actual users will need to update their birthday_date
UPDATE users
SET birthday_date = CURRENT_DATE - (age * INTERVAL '1 year')
WHERE age IS NOT NULL;

-- Remove the age column
ALTER TABLE users
  DROP COLUMN age; 