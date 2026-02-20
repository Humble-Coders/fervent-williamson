import { apiClient } from './api';
import { ApiResponse, PaginationParams } from '../types/api';

/**
 * Base service class that provides common CRUD operations
 * All specific services should extend this class
 */
export abstract class BaseService<T, CreateT = Partial<T>, UpdateT = Partial<T>> {
  protected readonly endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  /**
   * Get all items with optional pagination and filtering
   */
  async getAll(params?: PaginationParams & Record<string, unknown>): Promise<ApiResponse<T[]>> {
    return apiClient.getPaginated<T>(this.endpoint, params);
  }

  /**
   * Get a single item by ID
   */
  async getById(id: string | number): Promise<ApiResponse<T>> {
    return apiClient.get<T>(`${this.endpoint}/${id}`);
  }

  /**
   * Create a new item
   */
  async create(data: CreateT): Promise<ApiResponse<T>> {
    return apiClient.post<T>(this.endpoint, data);
  }

  /**
   * Update an existing item
   */
  async update(id: string | number, data: UpdateT): Promise<ApiResponse<T>> {
    return apiClient.patch<T>(`${this.endpoint}/${id}`, data);
  }

  /**
   * Delete an item
   */
  async delete(id: string | number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Search items
   */
  async search(query: string, params?: Record<string, unknown>): Promise<ApiResponse<T[]>> {
    return apiClient.get<T[]>(`${this.endpoint}/search`, {
      params: { q: query, ...params },
    });
  }

  /**
   * Bulk create items
   */
  async bulkCreate(items: CreateT[]): Promise<ApiResponse<T[]>> {
    return apiClient.post<T[]>(`${this.endpoint}/bulk`, { items });
  }

  /**
   * Bulk update items
   */
  async bulkUpdate(updates: Array<{ id: string | number; data: UpdateT }>): Promise<ApiResponse<T[]>> {
    return apiClient.patch<T[]>(`${this.endpoint}/bulk`, { updates });
  }

  /**
   * Bulk delete items
   */
  async bulkDelete(ids: Array<string | number>): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.endpoint}/bulk`, {
      data: { ids },
    });
  }

  /**
   * Get items count
   */
  async count(params?: Record<string, unknown>): Promise<ApiResponse<{ count: number }>> {
    return apiClient.get<{ count: number }>(`${this.endpoint}/count`, {
      params,
    });
  }

  /**
   * Check if item exists
   */
  async exists(id: string | number): Promise<ApiResponse<{ exists: boolean }>> {
    return apiClient.get<{ exists: boolean }>(`${this.endpoint}/${id}/exists`);
  }

  /**
   * Upload file for an item
   */
  async uploadFile(id: string | number, file: File, field = 'file'): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append(field, file);
    
    return apiClient.post<{ url: string }>(`${this.endpoint}/${id}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Upload multiple files for an item
   */
  async uploadFiles(id: string | number, files: File[], field = 'files'): Promise<ApiResponse<{ urls: string[] }>> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`${field}[${index}]`, file);
    });
    
    return apiClient.post<{ urls: string[] }>(`${this.endpoint}/${id}/upload-multiple`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Get related items
   */
  async getRelated(id: string | number, relation: string, params?: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>[]>> {
    return apiClient.get<Record<string, unknown>[]>(`${this.endpoint}/${id}/${relation}`, {
      params,
    });
  }

  /**
   * Add relation
   */
  async addRelation(id: string | number, relation: string, relatedId: string | number): Promise<ApiResponse<void>> {
    return apiClient.post<void>(`${this.endpoint}/${id}/${relation}/${relatedId}`);
  }

  /**
   * Remove relation
   */
  async removeRelation(id: string | number, relation: string, relatedId: string | number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.endpoint}/${id}/${relation}/${relatedId}`);
  }

  /**
   * Get statistics for the resource
   */
  async getStats(params?: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> {
    return apiClient.get<Record<string, unknown>>(`${this.endpoint}/stats`, {
      params,
    });
  }

  /**
   * Export data
   */
  async export(format: 'csv' | 'json' | 'xlsx' = 'json', params?: Record<string, unknown>): Promise<ApiResponse<{ url: string }>> {
    return apiClient.get<{ url: string }>(`${this.endpoint}/export`, {
      params: { format, ...params },
    });
  }

  /**
   * Import data
   */
  async import(file: File, options?: Record<string, unknown>): Promise<ApiResponse<{ imported: number; errors: unknown[] }>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }
    
    return apiClient.post<{ imported: number; errors: unknown[] }>(`${this.endpoint}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

/**
 * Service factory function to create service instances
 */
export function createService<T, CreateT = Partial<T>, UpdateT = Partial<T>>(
  endpoint: string
): BaseService<T, CreateT, UpdateT> {
  return new (class extends BaseService<T, CreateT, UpdateT> {
    constructor() {
      super(endpoint);
    }
  })();
}

export default BaseService;
