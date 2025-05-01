-- İlk olarak mevcut RLS politikalarını kaldıralım
DROP POLICY IF EXISTS "Admin ALL on Announcements" ON "Announcements";
DROP POLICY IF EXISTS "Enable read access for authenticated users on Announcements" ON "Announcements";

-- RLS'yi aktif edelim (zaten aktifse bu adım atlanabilir)
ALTER TABLE "Announcements" ENABLE ROW LEVEL SECURITY;

-- Admin kullanıcıları için tam yetki politikası
CREATE POLICY "Admin ALL on Announcements"
ON "Announcements"
AS PERMISSIVE
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'ADMIN')
WITH CHECK (auth.jwt() ->> 'role' = 'ADMIN');

-- Tüm kimliği doğrulanmış kullanıcılar için okuma erişimi
CREATE POLICY "Enable read access for authenticated users on Announcements"
ON "Announcements"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true); 