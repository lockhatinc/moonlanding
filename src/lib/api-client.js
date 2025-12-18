import { httpClient } from './http-client';

/**
 * API client for standard entity CRUD operations
 * Consolidates patterns from handlers.js and custom fetch calls
 */
export class ApiClient {
  constructor(baseUrl = '/api', httpClientInstance = httpClient) {
    this.baseUrl = baseUrl;
    this.client = httpClientInstance;
  }

  /**
   * List entities with optional pagination and search
   */
  async list(entity, options = {}) {
    const { page, pageSize, q } = options;
    const params = { page, pageSize, q };
    const url = this.client.buildUrl(`${this.baseUrl}/${entity}`, Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined)
    ));
    return this.client.get(url);
  }

  /**
   * Get a single entity by ID
   */
  async get(entity, id) {
    return this.client.get(`${this.baseUrl}/${entity}/${id}`);
  }

  /**
   * Create a new entity
   */
  async create(entity, data) {
    return this.client.post(`${this.baseUrl}/${entity}`, data);
  }

  /**
   * Update an entity
   */
  async update(entity, id, data) {
    return this.client.patch(`${this.baseUrl}/${entity}/${id}`, data);
  }

  /**
   * Delete an entity
   */
  async delete(entity, id) {
    return this.client.delete(`${this.baseUrl}/${entity}/${id}`);
  }

  /**
   * Send email via API
   */
  async sendEmail(emailData) {
    return this.client.post('/api/email', emailData);
  }

  /**
   * Upload file via API
   */
  async uploadFile(file, entityType, entityId, folderId) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entity_type', entityType);
    formData.append('entity_id', entityId);
    if (folderId) formData.append('folder_id', folderId);

    return fetch('/api/files', {
      method: 'POST',
      body: formData,
    }).then(r => r.json());
  }

  /**
   * Delete file via API
   */
  async deleteFile(fileId) {
    return this.client.delete(`/api/files?id=${fileId}`);
  }
}

export const apiClient = new ApiClient();
