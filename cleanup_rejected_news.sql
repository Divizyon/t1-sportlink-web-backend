-- Tüm rejected haberleri silmek için SQL sorgusu
DELETE FROM public."News" WHERE status = 'rejected'; 