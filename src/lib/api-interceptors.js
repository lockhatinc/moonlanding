import { apiClient } from './api-client-unified';

export function setupApiInterceptors() {
  apiClient.addInterceptor('request', (config) => {
    if (typeof window !== 'undefined' && window.__DEBUG__) {
      window.__DEBUG__.recordApiCall({
        method: config.method,
        endpoint: config.endpoint,
        timestamp: Date.now(),
        params: config.params,
      });
    }
    return config;
  });

  apiClient.addInterceptor('error', (error) => {
    console.error('[API Error]', {
      status: error.status,
      message: error.message,
      timestamp: new Date().toISOString(),
    });

    if (error.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized - redirecting to login');
    }

    if (error.status === 403) {
      throw new Error('Access denied');
    }

    if (error.status >= 500) {
      throw new Error('Server error - please try again later');
    }

    throw error;
  });

  apiClient.addInterceptor('response', (response) => {
    if (typeof window !== 'undefined' && window.__DEBUG__) {
      window.__DEBUG__.recordApiResponse({
        data: response,
        timestamp: Date.now(),
      });
    }
    return response;
  });
}

if (typeof window !== 'undefined') {
  setupApiInterceptors();
}
