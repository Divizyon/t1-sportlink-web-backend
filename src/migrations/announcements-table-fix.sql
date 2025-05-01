-- Announcements tablosu için RLS düzeltme
-- Bu SQL'i Supabase SQL Editor'da çalıştırın

-- 1. RLS'yi devre dışı bırak
ALTER TABLE "Announcements" DISABLE ROW LEVEL SECURITY;

-- 2. Supabase-auth şemasının service_role rolüne tam erişim hakkı ver
GRANT ALL ON "Announcements" TO service_role;
GRANT ALL ON "Announcements" TO postgres;
GRANT ALL ON "Announcements" TO anon;
GRANT ALL ON "Announcements" TO authenticated;

-- 3. Tüm announcements sequence'lerine erişim izni ver
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4. RLS'yi tamamen devre dışı bırak (sadece ciddi sorunlar varsa bu seçeneği kullanın)
-- Yorum satırlarını kaldırarak aktif edebilirsiniz
-- ALTER TABLE "Announcements" FORCE ROW LEVEL SECURITY; 