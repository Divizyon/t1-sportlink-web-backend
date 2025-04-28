export interface NewsItem {
  id?: number;
  title: string;
  content: string;
  source_url: string;
  image_url: string;
  published_date: Date;
  sport_id: number;
  created_at?: Date;
  updated_at?: Date;
  status: NewsStatus;
  tags?: string[];
  type: string;
}

export enum NewsStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface ScrapedNews {
  title: string;
  content: string;
  source_url: string;
  image_url: string;
  published_date: Date | string;
  category?: string;
  tags?: string[];
} 