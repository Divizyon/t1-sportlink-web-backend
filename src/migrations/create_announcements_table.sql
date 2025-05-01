-- Duyurular tablosunu oluştur
CREATE TABLE IF NOT EXISTS "Announcements" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  creator_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS politikalarını ayarla

-- Tüm tabloyu varsayılan olarak kısıtla
ALTER TABLE "Announcements" ENABLE ROW LEVEL SECURITY;

-- Herkes için okuma izni
CREATE POLICY "Announcements okuma izni - herkes" 
ON "Announcements" FOR SELECT 
USING (true);

-- Sadece adminlerin yazma izni
CREATE POLICY "Announcements yazma izni - sadece admin" 
ON "Announcements" FOR INSERT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "UserProfiles"
    WHERE "UserProfiles".user_id = auth.uid()
    AND "UserProfiles".role = 'admin'
  )
);

-- Sadece adminlerin düzenleme izni
CREATE POLICY "Announcements düzenleme izni - sadece admin" 
ON "Announcements" FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "UserProfiles"
    WHERE "UserProfiles".user_id = auth.uid()
    AND "UserProfiles".role = 'admin'
  )
);

-- Sadece adminlerin silme izni
CREATE POLICY "Announcements silme izni - sadece admin" 
ON "Announcements" FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "UserProfiles"
    WHERE "UserProfiles".user_id = auth.uid()
    AND "UserProfiles".role = 'admin'
  )
); 