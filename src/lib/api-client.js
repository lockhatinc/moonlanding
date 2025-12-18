import { httpClient } from './http-client';

export class ApiClient {
  constructor(baseUrl = '/api', httpClientInstance = httpClient) {
    this.baseUrl = baseUrl;
    this.client = httpClientInstance;
  }

  

  async list(entity, options = {}) {
    const { page, pageSize, q } = options;
    const params = { page, pageSize, q };
    const url = this.client.buildUrl(`${this.baseUrl}/${entity}`, Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined)
    ));
    return this.client.get(url);
  }

  

  async get(entity, id) {
    return this.client.get(`${this.baseUrl}/${entity}/${id}`);
  }

  

  async create(entity, data) {
    return this.client.post(`${this.baseUrl}/${entity}`, data);
  }

  

  async update(entity, id, data) {
    return this.client.patch(`${this.baseUrl}/${entity}/${id}`, data);
  }

  

  async delete(entity, id) {
    return this.client.delete(`${this.baseUrl}/${entity}/${id}`);
  }

  

  async sendEmail(emailData) {
    return this.client.post('/api/email', emailData);
  }

  

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

  

  async deleteFile(fileId) {
    return this.client.delete(`/api/files?id=${fileId}`);
  }
}

export const apiClient = new ApiClient();
