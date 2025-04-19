export interface Sport {
  id: string;
  name: string;
  type: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSportDTO {
  name: string;
  type: string;
  description?: string;
}

export interface UpdateSportDTO {
  name?: string;
  type?: string;
  description?: string;
} 