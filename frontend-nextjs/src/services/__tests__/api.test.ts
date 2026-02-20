import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, setAuthToken, clearAuthToken } from '../api';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAuthToken();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication', () => {
    it('should set authorization header when token is provided', () => {
      const token = 'mock-token';
      setAuthToken(token);

      // Make a request to verify header is set
      server.use(
        http.get('*/test', ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          expect(authHeader).toBe(`Bearer ${token}`);
          return HttpResponse.json({ success: true });
        })
      );

      return api.get('/test');
    });

    it('should clear authorization header when token is cleared', () => {
      setAuthToken('mock-token');
      clearAuthToken();

      server.use(
        http.get('*/test', ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          expect(authHeader).toBeNull();
          return HttpResponse.json({ success: true });
        })
      );

      return api.get('/test');
    });

    it('should automatically refresh token on 401 response', async () => {
      mockLocalStorage.getItem.mockReturnValue('refresh-token');
      
      let requestCount = 0;
      server.use(
        http.get('*/protected', () => {
          requestCount++;
          if (requestCount === 1) {
            return HttpResponse.json(
              { success: false, message: 'Token expired' },
              { status: 401 }
            );
          }
          return HttpResponse.json({ success: true, data: 'protected data' });
        }),
        http.post('*/auth/refresh', () => {
          return HttpResponse.json({
            success: true,
            data: {
              token: 'new-token',
              refreshToken: 'new-refresh-token',
            },
          });
        })
      );

      const response = await api.get('/protected');
      
      expect(requestCount).toBe(2);
      expect(response.data).toEqual({ success: true, data: 'protected data' });
    });

    it('should logout user when refresh token is invalid', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-refresh-token');
      
      server.use(
        http.get('*/protected', () => {
          return HttpResponse.json(
            { success: false, message: 'Token expired' },
            { status: 401 }
          );
        }),
        http.post('*/auth/refresh', () => {
          return HttpResponse.json(
            { success: false, message: 'Invalid refresh token' },
            { status: 401 }
          );
        })
      );

      try {
        await api.get('/protected');
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      }
    });
  });

  describe('Request/Response Handling', () => {
    it('should handle successful GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      
      server.use(
        http.get('*/test', () => {
          return HttpResponse.json({ success: true, data: mockData });
        })
      );

      const response = await api.get('/test');
      
      expect(response.data).toEqual({ success: true, data: mockData });
      expect(response.status).toBe(200);
    });

    it('should handle successful POST request', async () => {
      const postData = { name: 'New Item' };
      const responseData = { id: 1, ...postData };
      
      server.use(
        http.post('*/test', async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual(postData);
          return HttpResponse.json({ success: true, data: responseData });
        })
      );

      const response = await api.post('/test', postData);
      
      expect(response.data).toEqual({ success: true, data: responseData });
    });

    it('should handle PUT request', async () => {
      const updateData = { id: 1, name: 'Updated Item' };
      
      server.use(
        http.put('*/test/1', async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual(updateData);
          return HttpResponse.json({ success: true, data: updateData });
        })
      );

      const response = await api.put('/test/1', updateData);
      
      expect(response.data).toEqual({ success: true, data: updateData });
    });

    it('should handle DELETE request', async () => {
      server.use(
        http.delete('*/test/1', () => {
          return HttpResponse.json({ success: true, message: 'Deleted successfully' });
        })
      );

      const response = await api.delete('/test/1');
      
      expect(response.data).toEqual({ success: true, message: 'Deleted successfully' });
    });

    it('should handle query parameters', async () => {
      server.use(
        http.get('*/test', ({ request }) => {
          const url = new URL(request.url);
          const page = url.searchParams.get('page');
          const limit = url.searchParams.get('limit');
          
          expect(page).toBe('1');
          expect(limit).toBe('10');
          
          return HttpResponse.json({ success: true, data: [] });
        })
      );

      await api.get('/test', { params: { page: 1, limit: 10 } });
    });
  });

  describe('Error Handling', () => {
    it('should handle 400 Bad Request', async () => {
      server.use(
        http.post('*/test', () => {
          return HttpResponse.json(
            { success: false, message: 'Validation error', errors: ['Invalid data'] },
            { status: 400 }
          );
        })
      );

      try {
        await api.post('/test', {});
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.message).toBe('Validation error');
        expect(error.response.data.errors).toEqual(['Invalid data']);
      }
    });

    it('should handle 404 Not Found', async () => {
      server.use(
        http.get('*/test/999', () => {
          return HttpResponse.json(
            { success: false, message: 'Not found' },
            { status: 404 }
          );
        })
      );

      try {
        await api.get('/test/999');
      } catch (error) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.message).toBe('Not found');
      }
    });

    it('should handle 500 Internal Server Error', async () => {
      server.use(
        http.get('*/test', () => {
          return HttpResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
          );
        })
      );

      try {
        await api.get('/test');
      } catch (error) {
        expect(error.response.status).toBe(500);
        expect(error.response.data.message).toBe('Internal server error');
      }
    });

    it('should handle network errors', async () => {
      server.use(
        http.get('*/test', () => {
          return HttpResponse.error();
        })
      );

      try {
        await api.get('/test');
      } catch (error) {
        expect(error.message).toContain('Network Error');
      }
    });

    it('should handle timeout errors', async () => {
      server.use(
        http.get('*/test', () => {
          return new Promise(() => {}); // Never resolves
        })
      );

      try {
        await api.get('/test', { timeout: 100 });
      } catch (error) {
        expect(error.code).toBe('ECONNABORTED');
      }
    });
  });

  describe('Request Interceptors', () => {
    it('should add request timestamp', async () => {
      server.use(
        http.get('*/test', ({ request }) => {
          const timestamp = request.headers.get('X-Request-Time');
          expect(timestamp).toBeTruthy();
          return HttpResponse.json({ success: true });
        })
      );

      await api.get('/test');
    });

    it('should add request ID for tracking', async () => {
      server.use(
        http.get('*/test', ({ request }) => {
          const requestId = request.headers.get('X-Request-ID');
          expect(requestId).toBeTruthy();
          expect(requestId).toMatch(/^[a-f0-9-]{36}$/); // UUID format
          return HttpResponse.json({ success: true });
        })
      );

      await api.get('/test');
    });

    it('should add content-type for JSON requests', async () => {
      server.use(
        http.post('*/test', ({ request }) => {
          const contentType = request.headers.get('Content-Type');
          expect(contentType).toBe('application/json');
          return HttpResponse.json({ success: true });
        })
      );

      await api.post('/test', { data: 'test' });
    });
  });

  describe('Response Interceptors', () => {
    it('should log response time', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      server.use(
        http.get('*/test', () => {
          return HttpResponse.json({ success: true });
        })
      );

      await api.get('/test');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Request to /test took')
      );
      
      consoleSpy.mockRestore();
    });

    it('should transform response data', async () => {
      server.use(
        http.get('*/test', () => {
          return HttpResponse.json({
            success: true,
            data: { created_at: '2024-01-01T00:00:00Z' }
          });
        })
      );

      const response = await api.get('/test');
      
      // Should transform snake_case to camelCase
      expect(response.data.data).toHaveProperty('createdAt');
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed requests', async () => {
      let attemptCount = 0;
      
      server.use(
        http.get('*/test', () => {
          attemptCount++;
          if (attemptCount < 3) {
            return HttpResponse.error();
          }
          return HttpResponse.json({ success: true, attempt: attemptCount });
        })
      );

      const response = await api.get('/test', { retry: 3 });
      
      expect(attemptCount).toBe(3);
      expect(response.data.attempt).toBe(3);
    });

    it('should not retry on 4xx errors', async () => {
      let attemptCount = 0;
      
      server.use(
        http.get('*/test', () => {
          attemptCount++;
          return HttpResponse.json(
            { success: false, message: 'Bad request' },
            { status: 400 }
          );
        })
      );

      try {
        await api.get('/test', { retry: 3 });
      } catch (error) {
        expect(attemptCount).toBe(1);
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe('Caching', () => {
    it('should cache GET requests', async () => {
      let requestCount = 0;
      
      server.use(
        http.get('*/test', () => {
          requestCount++;
          return HttpResponse.json({ success: true, count: requestCount });
        })
      );

      // First request
      const response1 = await api.get('/test', { cache: true });
      
      // Second request should use cache
      const response2 = await api.get('/test', { cache: true });
      
      expect(requestCount).toBe(1);
      expect(response1.data.count).toBe(1);
      expect(response2.data.count).toBe(1);
    });

    it('should not cache POST requests', async () => {
      let requestCount = 0;
      
      server.use(
        http.post('*/test', () => {
          requestCount++;
          return HttpResponse.json({ success: true, count: requestCount });
        })
      );

      await api.post('/test', {}, { cache: true });
      await api.post('/test', {}, { cache: true });
      
      expect(requestCount).toBe(2);
    });
  });

  describe('Request Cancellation', () => {
    it('should cancel requests when abort signal is triggered', async () => {
      const controller = new AbortController();
      
      server.use(
        http.get('*/test', () => {
          return new Promise(() => {}); // Never resolves
        })
      );

      const requestPromise = api.get('/test', { signal: controller.signal });
      
      // Cancel the request
      controller.abort();
      
      try {
        await requestPromise;
      } catch (error) {
        expect(error.name).toBe('AbortError');
      }
    });
  });
});
