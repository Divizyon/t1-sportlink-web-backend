import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapedNews } from '../types/News';
import supabase from '../config/supabase';

export class NewsScraperService {
  
  // Spor kategorilerine göre anahtar kelimeler
  private sportKeywords: Record<number, string[]> = {
    4: ['futbol', 'maç', 'gol', 'lig', 'transfer', 'süper lig', 'şampiyonlar ligi', 'teknik direktör', 'penaltı', 'stadyum', 'takım', 'kupa'],
    5: ['basketbol', 'nba', 'sayı', 'smaç', 'euroleague', 'potaya', 'basketbol süper ligi', 'basketbol milli takım', 'ribaund'],
    14: ['voleybol', 'filenin', 'file', 'smaç', 'servis', 'libero', 'blok', 'efeler ligi', 'sultanlar ligi', 'voleybol federasyonu'],
    6: ['tenis', 'kort', 'raket', 'grand slam', 'wimbledon', 'roland garros', 'us open', 'australian open', 'atp', 'wta', 'servis', 'tie-break'],
    9: ['yüzme', 'havuz', 'kulaç', 'sırt', 'kurbağalama', 'kelebek', 'serbest stil', 'olimpik yüzme', 'sporcu', 'mavi bayrak', 'yüzücü'],
    10: ['koşu', 'maraton', 'yarı maraton', 'sprint', 'atletizm', 'koşucu', 'parkur', 'pist', 'yarış', 'mesafe', 'antrenman'],
    11: ['yoga', 'meditasyon', 'asana', 'nefes', 'denge', 'esneklik', 'beden', 'zihin', 'hareket', 'sağlık', 'wellness'],
    13: ['bisiklet', 'pedal', 'tur', 'bisikletçi', 'yarış', 'dağ bisikleti', 'yol bisikleti', 'etap', 'sürüş', 'kadans', 'velodrom'],
    15: ['yürüyüş', 'adım', 'tempo', 'hiking', 'doğa yürüyüşü', 'fitness', 'cardio', 'sağlık', 'zayıflama', 'aktivite', 'parkur']
  };
  
  // URL kategorilerine göre özel spor sayfaları
  private sportUrlPatterns: Record<number, string[]> = {
    4: ['futbol', 'superlig', 'sampiyonlar-ligi', 'premier-lig'],
    5: ['basketbol', 'nba', 'euroleague', 'bsl'],  
    14: ['voleybol'],
    6: ['tenis'],
    9: ['yuzme', 'swim'],
    10: ['kosu', 'running', 'atletizm', 'maraton'],
    11: ['yoga'],
    13: ['bisiklet', 'cycling'],
    15: ['yuruyus', 'walking']
  };
  
  /**
   * HTTP isteği yapar, farklı hata durumlarını ele alır
   * @param url İstek yapılacak URL
   * @returns HTTP yanıtı
   */
  private async makeRequest(url: string): Promise<any> {
    try {
      // Farklı User-Agent'lar deneyelim, bazı siteler belirli User-Agent'ları engeller
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36'
      ];
      
      // Referrer başlıkları ekleyelim, bazı siteler referrer kontrolü yapar
      const referrers = [
        'https://www.google.com',
        'https://www.bing.com',
        'https://www.facebook.com'
      ];
      
      // Rastgele User-Agent ve Referrer seçelim
      const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
      const referrer = referrers[Math.floor(Math.random() * referrers.length)];
      
      // İsteği yapalım
      const response = await axios.get(url, {
        headers: {
          'User-Agent': userAgent,
          'Referer': referrer,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 10000 // 10 saniye timeout
      });
      
      return response;
    } catch (error: any) {
      // Hata durumlarını detaylı loglayalım
      if (error.response) {
        // Sunucu yanıt verdi ama başarısız durum kodu
        console.error(`HTTP Hata ${error.response.status}: ${url}`);
      } else if (error.request) {
        // İstek yapıldı ama yanıt alınamadı (timeout, ağ hatası vs.)
        console.error(`Ağ Hatası: ${url} - ${error.message}`);
      } else {
        // İstek oluşturulurken bir hata oluştu
        console.error(`İstek Hatası: ${url} - ${error.message}`);
      }
      
      throw error;
    }
  }
  
  /**
   * Belirtilen URL'den haberleri scrape eder
   * @param url Haber sitesi URL'si
   * @param sportId Spor kategorisi ID'si
   * @returns Scrape edilen haberler
   */
  public async scrapeNewsFromUrl(url: string, sportId?: number): Promise<ScrapedNews[]> {
    try {
      console.log(`Haber scraping başlıyor: ${url}, Sport ID: ${sportId}`);
      
      let response;
      try {
        response = await this.makeRequest(url);
        console.log(`Bağlantı başarılı: ${url} - Durum Kodu: ${response.status}`);
      } catch (error: any) {
        console.error(`Site bağlantı hatası, proxy kullanılacak: ${error.message}`);
        // Doğrudan bağlantı başarısız olduysa, bir proxy servis üzerinden deneyelim
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        response = await this.makeRequest(proxyUrl);
        console.log(`Proxy bağlantı başarılı: ${url}`);
      }
      
      const $ = cheerio.load(response.data);
      
      const news: ScrapedNews[] = [];
      let domain = new URL(url).hostname;
      console.log(`Domain: ${domain}`);
      
      // Site bazlı özel işlemler
      if (domain.includes('sabah.com')) {
        console.log('Sabah.com için scraping yapılıyor...');
        
        // Sabah.com için özel seçiciler
        const sabahSelectors = [
          '.newsBox', 
          '.content',
          '.newsDetailContainer',
          '.sportNewsCard',
          '.newsDetail',
          '.news'
        ];
        
        for (const selector of sabahSelectors) {
          console.log(`"${selector}" seçicisi deneniyor. Bulunan öğe sayısı: ${$(selector).length}`);
          
          $(selector).each((i, element) => {
            try {
              // Başlık arama
              const title = $(element).find('h1, h2, h3, h4, .title, .caption, .headline').first().text().trim();
              
              // İçerik arama
              const content = $(element).find('p, .detail, .summary, .spot').first().text().trim();
              
              // Link arama
              let sourceUrl = '';
              if ($(element).is('a')) {
                sourceUrl = $(element).attr('href') || '';
              } else {
                sourceUrl = $(element).find('a').first().attr('href') || '';
              }
              
              // Görsel arama
              const imageUrl = $(element).find('img').attr('data-src') || 
                              $(element).find('img').attr('src') || 
                              $(element).find('figure img').attr('src') || '';
              
              // URL düzeltme
              if (sourceUrl && !sourceUrl.startsWith('http')) {
                sourceUrl = `https://www.sabah.com.tr${sourceUrl}`;
              }
              
              // Spor ID'sine göre filtreleme
              if (title && this.isRelevantToSport(title, content, sourceUrl, sportId)) {
                console.log(`Sabah.com'dan haber bulundu (${selector} seçicisi, ${sportId} ile ilgili): ${title}`);
                
                // Mükerrer kontrol
                const isDuplicate = news.some(item => item.title === title);
                if (!isDuplicate) {
                  news.push({
                    title,
                    content: content || title,
                    source_url: sourceUrl,
                    image_url: imageUrl,
                    published_date: new Date(),
                    category: 'spor',
                    tags: ['spor']
                  });
                }
              }
            } catch (err) {
              console.error('Sabah.com haber öğesi işlenirken hata:', err);
            }
          });
        }
      } else if (domain.includes('haberturk.com')) {
        console.log('Haberturk.com için scraping yapılıyor...');
        
        // HTML yapısını incelemek için bazı temel bilgileri loglayalım
        console.log(`Sayfa başlığı: ${$('title').text()}`);
        console.log(`Ana seçiciler:`, {
          newsCards: $('.news-card').length,
          newsItems: $('.news-item').length,
          articles: $('article').length,
          newsContainers: $('.news-container').length,
          sporhaber: $('.spor-haber').length
        });
        
        // Haberturk için geliştirilmiş seçiciler - birden fazla farklı seçici deneyelim
        const selectors = [
          // Mevcut seçici
          '.news-card',
          // Alternatif seçiciler
          '.htNews', 
          '.news-box', 
          '.news-item',
          '.video-news-list .news-box',
          '.spor-content article',
          '.widget-news-list li',
          '.swiper-slide',
          '.htSlide-item'
        ];
        
        // Tüm seçicileri dene
        for (const selector of selectors) {
          console.log(`"${selector}" seçicisi deneniyor. Bulunan öğe sayısı: ${$(selector).length}`);
          
          $(selector).each((i, element) => {
            try {
              // Başlık için farklı seçiciler dene
              const titleSelectors = ['h1', 'h2', 'h3', 'h4', '.title', '.news-title', '.news-name', '.name'];
              let title = '';
              
              for (const titleSelector of titleSelectors) {
                const foundTitle = $(element).find(titleSelector).first().text().trim();
                if (foundTitle) {
                  title = foundTitle;
                  break;
                }
              }
              
              // İçerik için farklı seçiciler dene
              const contentSelectors = ['.desc', '.description', '.content', '.summary', 'p'];
              let content = '';
              
              for (const contentSelector of contentSelectors) {
                const foundContent = $(element).find(contentSelector).first().text().trim();
                if (foundContent) {
                  content = foundContent;
                  break;
                }
              }
              
              // URL için farklı yöntemler dene
              let sourceUrl = '';
              if ($(element).is('a')) {
                sourceUrl = $(element).attr('href') || '';
              } else {
                sourceUrl = $(element).find('a').first().attr('href') || '';
              }
              
              // Resim için farklı yöntemler dene
              const imageUrl = $(element).find('img').attr('data-src') || 
                               $(element).find('img').attr('src') || 
                               $(element).find('.img-holder img').attr('src') || '';
              
              // Kategori al veya varsayılan değer kullan
              const category = $(element).find('.category, .tag, .cat').first().text().trim() || "spor";
              
              // URL'yi düzelt
              if (sourceUrl && !sourceUrl.startsWith('http')) {
                sourceUrl = `https://www.haberturk.com${sourceUrl}`;
              }
              
              // Spor ID'sine göre filtreleme
              if (title && this.isRelevantToSport(title, content, sourceUrl, sportId)) {
                console.log(`Haber bulundu (${selector} seçicisi, ${sportId} ile ilgili): ${title}`);
                
                // Aynı başlıklı haber zaten var mı kontrol et
                const isDuplicate = news.some(item => item.title === title);
                
                if (!isDuplicate) {
                  news.push({
                    title,
                    content: content || title,
                    source_url: sourceUrl,
                    image_url: imageUrl,
                    published_date: new Date(),
                    category,
                    tags: [category]
                  });
                }
              }
            } catch (err) {
              console.error('Haber öğesi işlenirken hata:', err);
            }
          });
        }
      } else if (domain.includes('sporx.com')) {
        console.log('Sporx.com için scraping yapılıyor...');
        
        // Sporx ana sayfası
        $('.news, .news-item').each((i, element) => {
          try {
            const title = $(element).find('h3, h2, .title').text().trim();
            const content = $(element).find('.desc, p, .summary').text().trim();
            let sourceUrl = $(element).find('a').attr('href') || '';
            let imageUrl = $(element).find('img').attr('data-src') || $(element).find('img').attr('src') || '';
            const category = $(element).find('.cat').text().trim() || "spor";
            
            // URL'yi düzelt
            if (sourceUrl && !sourceUrl.startsWith('http')) {
              sourceUrl = `https://www.sporx.com${sourceUrl}`;
            }
            
            // Resim URL'sini düzelt
            if (imageUrl && !imageUrl.startsWith('http')) {
              imageUrl = `https://www.sporx.com${imageUrl}`;
            }
            
            // Spor ID'sine göre filtreleme
            if (title && this.isRelevantToSport(title, content, sourceUrl, sportId)) {
              console.log(`Haber bulundu (${sportId} ile ilgili): ${title}`);
              news.push({
                title,
                content: content || title,
                source_url: sourceUrl,
                image_url: imageUrl,
                published_date: new Date(),
                category,
                tags: [category]
              });
            }
          } catch (err) {
            console.error('Haber öğesi işlenirken hata:', err);
          }
        });
      } else if (domain.includes('hurriyet.com')) {
        console.log('Hurriyet.com için scraping yapılıyor...');
        
        // Hurriyet için özel seçiciler
        $('.news-item, article, .item, .news, .content-area').each((i, element) => {
          try {
            // Başlık arama
            const title = $(element).find('h1, h2, h3, .title, .news-detail-title').first().text().trim();
            
            // İçerik arama
            const content = $(element).find('p, .news-detail-spot, .spot, .description').first().text().trim();
            
            // Link arama
            let sourceUrl = $(element).find('a').attr('href') || '';
            
            // Görsel arama
            const imageUrl = $(element).find('img').attr('data-src') || $(element).find('img').attr('src') || '';
            
            // URL düzeltme
            if (sourceUrl && !sourceUrl.startsWith('http')) {
              sourceUrl = `https://www.hurriyet.com.tr${sourceUrl}`;
            }
            
            // Spor ID'sine göre filtreleme
            if (title && this.isRelevantToSport(title, content, sourceUrl, sportId)) {
              console.log(`Hurriyet.com'dan haber bulundu (${sportId} ile ilgili): ${title}`);
              
              // Mükerrer kontrol
              const isDuplicate = news.some(item => item.title === title);
              if (!isDuplicate) {
                news.push({
                  title,
                  content: content || title,
                  source_url: sourceUrl,
                  image_url: imageUrl,
                  published_date: new Date(),
                  category: 'spor',
                  tags: ['spor']
                });
              }
            }
          } catch (err) {
            console.error('Hurriyet.com haber öğesi işlenirken hata:', err);
          }
        });
      } else {
        // Genel haber siteleri için iyileştirilmiş scraping
        console.log('Genel haber sitesi için scraping yapılıyor...');
        
        // Birçok farklı siteyi kapsayacak şekilde yaygın selektörler
        const commonSelectors = [
          'article', '.news-item', '.card', '.news-box', '.news-card', '.item',
          '[class*="news"]', '[class*="article"]', '.post', '.entry', '.story',
          '.content-item', '.list-item', '.headline', '.featured', '.spotlight'
        ];
        
        for (const selector of commonSelectors) {
          $(selector).each((i, element) => {
            try {
              // Başlık, içerik, URL ve görsel bulma
              const title = $(element).find('h1, h2, h3, h4, .title, .headline, .caption').first().text().trim();
              const content = $(element).find('p, .content, .summary, .description, .desc, .text, .spot').first().text().trim();
              let sourceUrl = '';
              
              if ($(element).is('a')) {
                sourceUrl = $(element).attr('href') || '';
              } else {
                sourceUrl = $(element).find('a').first().attr('href') || '';
              }
              
              const imageUrl = $(element).find('img').attr('data-src') || 
                              $(element).find('img').attr('src') || 
                              $(element).find('img').attr('data-original') || '';
              
              // URL düzeltme
              if (sourceUrl && !sourceUrl.startsWith('http')) {
                sourceUrl = new URL(sourceUrl, url).toString();
              }
              
              // Spor ID'sine göre filtreleme
              if (title && this.isRelevantToSport(title, content, sourceUrl, sportId)) {
                console.log(`Genel siteden haber bulundu (${selector}, ${sportId} ile ilgili): ${title}`);
                
                // Mükerrer kontrol
                const isDuplicate = news.some(item => item.title === title);
                if (!isDuplicate) {
                  news.push({
                    title,
                    content: content || title,
                    source_url: sourceUrl || url,
                    image_url: imageUrl,
                    published_date: new Date(),
                    category: 'spor',
                    tags: ['spor']
                  });
                }
              }
            } catch (err) {
              console.error('Genel haber öğesi işlenirken hata:', err);
            }
          });
        }
      }
      
      console.log(`Normal scraping sonucu ${news.length} haber bulundu (${sportId} spor ID'si ile ilgili).`);
      
      // Eğer haber bulunamadıysa veya az haber bulunduysa, genel bir tarama yap
      if (news.length < 5) {
        console.log('Yeterli haber bulunamadı, alternatif arama yapılıyor...');
        
        // En yaygın haber seçicileri dene
        $('a').each((i, element) => {
          try {
            // Yalnızca belirli derinlikteki linkleri incele
            if (i > 200) return; // Daha fazla link kontrol et (100 -> 200)
            
            const $link = $(element);
            const href = $link.attr('href');
            
            // Link metni uzunluğu bir başlık olacak kadar uzun mu kontrol et
            const linkText = $link.text().trim();
            
            // Çok kısa veya boş metinleri atla
            if (linkText.length < 10) return;
            
            // Görsel bul
            const $parent = $link.parent();
            const $grandparent = $parent.parent();
            const $img = $link.find('img').length ? $link.find('img') : 
                        $parent.find('img').length ? $parent.find('img') : 
                        $grandparent.find('img');
            const imageUrl = $img.attr('data-src') || $img.attr('src') || '';
            
            // İçerik metni için kısa bir özet bul
            const $contentElement = $link.next('p') || $parent.find('p') || $grandparent.find('p, .desc, .summary');
            const content = $contentElement.text().trim() || linkText;
            
            // Tam URL oluştur
            let fullUrl = '';
            if (href && !href.startsWith('http')) {
              fullUrl = new URL(href, url).toString();
            } else if (href) {
              fullUrl = href;
            } else {
              return; // href yoksa bu linki atla
            }
            
            // URL'in site içi olup olmadığını kontrol et
            if (!fullUrl.includes(domain)) return;
            
            // Fragment (#) veya javascript içeren linkleri atla
            if (href?.includes('#') || href?.includes('javascript:')) return;
            
            // Spor ID'sine göre filtreleme
            if (this.isRelevantToSport(linkText, content, fullUrl, sportId)) {
              console.log(`Alternatif haber bulundu (${sportId} ile ilgili): ${linkText}`);
              
              // Aynı başlıklı haber zaten var mı kontrol et
              const isDuplicate = news.some(item => item.title === linkText);
              
              if (!isDuplicate) {
                news.push({
                  title: linkText,
                  content,
                  source_url: fullUrl,
                  image_url: imageUrl,
                  published_date: new Date(),
                  category: 'spor',
                  tags: ['spor']
                });
              }
            }
          } catch (err) {
            console.error('Alternatif haber öğesi işlenirken hata:', err);
          }
        });
      }
      
      console.log(`Toplam ${news.length} haber bulundu ve döndürülecek (${sportId} ile ilgili).`);
      return news;
    } catch (error: any) {
      console.error('Haber scraping hatası:', error);
      throw new Error(`URL'den haber çekilemedi: ${error.message}`);
    }
  }
  
  /**
   * İçeriğin belirli bir sporla ilgili olup olmadığını kontrol eder
   * @param title Haber başlığı
   * @param content Haber içeriği
   * @param url Haber URL'si
   * @param sportId Spor ID'si
   * @returns İlgili sporla alakalı mı
   */
  private isRelevantToSport(title: string, content: string, url: string, sportId?: number): boolean {
    // Spor ID'si yoksa veya geçersizse tüm haberleri kabul et
    if (!sportId || !this.sportKeywords[sportId]) {
      return true;
    }
    
    const combinedText = (title + ' ' + content).toLowerCase();
    const urlLower = url.toLowerCase();
    
    // URL içerisinde spor kategorisine özel bir path var mı kontrol et
    const urlPatterns = this.sportUrlPatterns[sportId] || [];
    for (const pattern of urlPatterns) {
      if (urlLower.includes(`/${pattern}/`) || urlLower.includes(`=${pattern}&`) || 
          urlLower.includes(`-${pattern}-`) || urlLower.includes(`/${pattern}.`)) {
        return true;
      }
    }
    
    // Anahtar kelimeleri kontrol et
    const keywords = this.sportKeywords[sportId];
    for (const keyword of keywords) {
      if (combinedText.includes(keyword.toLowerCase())) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Scrape edilmiş haberleri veritabanına kaydeder
   * @param news Scrape edilmiş haberler
   * @param sportId Spor kategorisi ID'si
   * @returns Kaydedilen haber kayıtları
   */
  public async saveScrapedNews(news: ScrapedNews[], sportId: number): Promise<any[]> {
    try {
      const savedNews = [];
      
      for (const item of news) {
        // Aynı source_url ile kayıt var mı kontrol et
        const { data: existingNews } = await supabase
          .from('News')
          .select('id')
          .eq('source_url', item.source_url)
          .single();
          
        if (!existingNews) {
          // Yeni haber kaydı oluştur
          const { data, error } = await supabase
            .from('News')
            .insert({
              title: item.title,
              content: item.content,
              source_url: item.source_url,
              image_url: item.image_url,
              published_date: item.published_date,
              sport_id: sportId,
              status: 'pending',
              tags: item.tags || [],
              type: 'external',
              created_at: new Date(),
              updated_at: new Date()
            })
            .select();
            
          if (error) throw error;
          if (data) savedNews.push(data[0]);
        }
      }
      
      return savedNews;
    } catch (error: any) {
      console.error('Haber kaydetme hatası:', error);
      throw new Error(`Haberler veritabanına kaydedilemedi: ${error.message}`);
    }
  }
  
  /**
   * Haberlerin durumunu günceller
   * @param newsId Haber ID'si
   * @param status Yeni durum
   */
  public async updateNewsStatus(newsId: number, status: string): Promise<any> {
    try {
      // Eğer durum "rejected" ise haberi sil
      if (status === 'rejected') {
        console.log(`Haber reddedildi, ID: ${newsId} - siliniyor`);
        const { data, error } = await supabase
          .from('News')
          .delete()
          .eq('id', newsId)
          .select();
          
        if (error) throw error;
        console.log(`Haber silindi, ID: ${newsId}`);
        return data;
      } else {
        // Diğer durumlarda normal güncelleme yap
        const { data, error } = await supabase
          .from('News')
          .update({ 
            status, 
            updated_at: new Date() 
          })
          .eq('id', newsId)
          .select();
          
        if (error) throw error;
        return data;
      }
    } catch (error: any) {
      console.error('Haber durumu güncelleme hatası:', error);
      throw new Error(`Haber durumu güncellenemedi: ${error.message}`);
    }
  }
  
  /**
   * Belirli durumdaki haberleri listeler
   * @param status Durum filtresi (opsiyonel)
   * @returns Haber listesi
   */
  public async listNewsByStatus(status?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('News')
        .select('*');
        
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Haber listeleme hatası:', error);
      throw new Error(`Haberler listelenemedi: ${error.message}`);
    }
  }
} 