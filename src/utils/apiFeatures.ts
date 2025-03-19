import { SupabaseClient } from '@supabase/supabase-js';

interface QueryParams {
  page?: string;
  limit?: string;
  sort?: string;
  fields?: string;
  [key: string]: any;
}

export class APIFeatures {
  private query: any;
  private queryParams: QueryParams;

  constructor(query: any, queryParams: QueryParams) {
    this.query = query;
    this.queryParams = { ...queryParams };

    // Remove fields that should not be used for filtering
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(field => delete this.queryParams[field]);
  }

  filter() {
    // Apply filters
    Object.keys(this.queryParams).forEach(key => {
      const value = this.queryParams[key];
      if (value) {
        this.query = this.query.eq(key, value);
      }
    });

    return this;
  }

  sort() {
    if (this.queryParams.sort) {
      const sortBy = this.queryParams.sort.split(',');
      
      sortBy.forEach(field => {
        const order = field.startsWith('-') ? 'desc' : 'asc';
        const fieldName = field.startsWith('-') ? field.substring(1) : field;
        
        this.query = this.query.order(fieldName, { ascending: order === 'asc' });
      });
    } else {
      // Default sort by created_at descending
      this.query = this.query.order('created_at', { ascending: false });
    }

    return this;
  }

  limitFields() {
    if (this.queryParams.fields) {
      const fields = this.queryParams.fields.split(',').join(',');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('*');
    }

    return this;
  }

  paginate() {
    const page = parseInt(this.queryParams.page || '1', 10);
    const limit = parseInt(this.queryParams.limit || '10', 10);
    const from = (page - 1) * limit;
    const to = page * limit - 1;

    this.query = this.query.range(from, to);

    return this;
  }

  getQuery() {
    return this.query;
  }
} 