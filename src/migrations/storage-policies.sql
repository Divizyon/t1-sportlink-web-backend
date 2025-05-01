-- Storage bucket izinleri için SQL komutları
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- sportlink-files bucket'ı için izinleri yapılandır

-- Announcements klasörü için RLS politikaları

-- 1. Admin kullanıcıların tüm izinleri (INSERT, SELECT, UPDATE, DELETE)
BEGIN;
INSERT INTO storage.policies (name, definition)
VALUES (
  'Admin Management for Announcements',
  '{"roleName":"authenticated","id":"sportlink-files","action":"ALL","check":"((auth.jwt() ->> ''role'')::text = ''ADMIN''::text)","match":{"path":"announcements/*"}}'
) ON CONFLICT (name) DO NOTHING;
COMMIT;

-- 2. Tüm kimliği doğrulanmış kullanıcılar ve anonim kullanıcılar için SELECT izni
BEGIN;
INSERT INTO storage.policies (name, definition)
VALUES (
  'Public Read Access for Announcements',
  '{"roleName":"anon","id":"sportlink-files","action":"SELECT","check":"true","match":{"path":"announcements/*"}}'
) ON CONFLICT (name) DO NOTHING;

INSERT INTO storage.policies (name, definition)
VALUES (
  'Authenticated Read Access for Announcements',
  '{"roleName":"authenticated","id":"sportlink-files","action":"SELECT","check":"true","match":{"path":"announcements/*"}}'
) ON CONFLICT (name) DO NOTHING;
COMMIT; 