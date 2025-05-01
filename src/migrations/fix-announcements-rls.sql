-- Önce mevcut politikaları kaldır
DROP POLICY IF EXISTS "Admin ALL on Announcements" ON "Announcements";
DROP POLICY IF EXISTS "Enable read access for authenticated users on Announcements" ON "Announcements";

-- RLS'yi geçici olarak devre dışı bırak, sorun devam ederse test için
ALTER TABLE "Announcements" DISABLE ROW LEVEL SECURITY;

-- Tablo erişim haklarını yeniden düzenle
ALTER TABLE "Announcements" OWNER TO postgres;

-- RLS'yi tekrar etkinleştir
ALTER TABLE "Announcements" ENABLE ROW LEVEL SECURITY;

-- Admin kullanıcılarına tam yetki veren politika
CREATE POLICY "Admin ALL on Announcements"
ON "Announcements"
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'ADMIN')
WITH CHECK (auth.jwt() ->> 'role' = 'ADMIN');

-- Tüm kimliği doğrulanmış kullanıcılara okuma yetkisi veren politika
CREATE POLICY "Enable read access for authenticated users on Announcements"
ON "Announcements"
FOR SELECT
TO authenticated
USING (true);

-- Anonim kullanıcılara okuma yetkisi veren politika
CREATE POLICY "Public read access for Announcements"
ON "Announcements"
FOR SELECT
TO anon
USING (true);

-- Duyuruları test etmek için
INSERT INTO "Announcements" (title, content, creator_id)
VALUES ('Test Duyurusu', 'Bu bir test duyurusudur. RLS politikalarını test etmek için eklenmiştir.', 
(SELECT id FROM auth.users LIMIT 1))
ON CONFLICT DO NOTHING;

-- Tüm duyuruları listele
SELECT * FROM "Announcements"; 