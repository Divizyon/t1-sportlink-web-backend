-- Create Announcements table
CREATE TABLE IF NOT EXISTS "Announcements" (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT, -- nullable for optional images
  creator_id UUID, -- nullable for optional creator reference
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable Row Level Security after table is created
ALTER TABLE "Announcements" DISABLE ROW LEVEL SECURITY; 