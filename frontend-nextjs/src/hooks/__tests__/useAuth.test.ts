import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { createMockUser } from '../../test/utils/testUtils';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('should initialize with no user when no token in localStorage', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should initialize with loading state when token exists in localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue('mock-token');

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(true);
  });

  it('should login successfully with valid credentials', async () => {
    const mockUser = createMockUser();
    const mockResponse = {
      success: true,
      data: {
        user: mockUser,
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
      },
    };

    server.use(
      http.post('*/auth/login', () => {
        return HttpResponse.json(mockResponse);
      })
    );

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'mock-token');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token');
  });

  it('should handle login failure', async () => {
    server.use(
      http.post('*/auth/login', () => {
        return HttpResponse.json(
          { success: false, message: 'Invalid credentials' },
          { status: 401 }
        );
      })
    );

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.login('test@example.com', 'wrongpassword');
      } catch (error) {
        expect(error.message).toBe('Invalid credentials');
      }
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
  });

  it('should register successfully', async () => {
    const mockUser = createMockUser();
    const mockResponse = {
      success: true,
      data: {
        user: mockUser,
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
      },
    };

    server.use(
      http.post('*/auth/register', () => {
        return HttpResponse.json(mockResponse);
      })
    );

    const { result } = renderHook(() => useAuth());

    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'CUSTOMER' as const,
    };

    await act(async () => {
      await result.current.register(userData);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'mock-token');
  });

  it('should logout successfully', async () => {
    // First login
    const mockUser = createMockUser();
    mockLocalStorage.getItem.mockReturnValue('mock-token');

    server.use(
      http.post('*/auth/logout', () => {
        return HttpResponse.json({ success: true });
      })
    );

    const { result } = renderHook(() => useAuth());

    // Set initial authenticated state
    act(() => {
      result.current.setUser(mockUser);
    });

    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
  });

  it('should refresh token when current token expires', async () => {
    const mockUser = createMockUser();
    const newToken = 'new-mock-token';
    
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'refreshToken') return 'mock-refresh-token';
      return null;
    });

    server.use(
      http.post('*/auth/refresh', () => {
        return HttpResponse.json({
          success: true,
          data: {
            user: mockUser,
            token: newToken,
            refreshToken: 'new-refresh-token',
          },
        });
      })
    );

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.refreshToken();
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', newToken);
  });

  it('should handle refresh token failure', async () => {
    mockLocalStorage.getItem.mockReturnValue('invalid-refresh-token');

    server.use(
      http.post('*/auth/refresh', () => {
        return HttpResponse.json(
          { success: false, message: 'Invalid refresh token' },
          { status: 401 }
        );
      })
    );

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.refreshToken();
      } catch (error) {
        expect(error.message).toBe('Invalid refresh token');
      }
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
  });

  it('should update user profile', async () => {
    const mockUser = createMockUser();
    const updatedUser = { ...mockUser, name: 'Updated Name' };

    server.use(
      http.put('*/users/*', () => {
        return HttpResponse.json({
          success: true,
          data: { user: updatedUser },
        });
      })
    );

    const { result } = renderHook(() => useAuth());

    // Set initial user
    act(() => {
      result.current.setUser(mockUser);
    });

    await act(async () => {
      await result.current.updateProfile({ name: 'Updated Name' });
    });

    expect(result.current.user?.name).toBe('Updated Name');
  });

  it('should check authentication status on mount', async () => {
    const mockUser = createMockUser();
    mockLocalStorage.getItem.mockReturnValue('mock-token');

    server.use(
      http.get('*/auth/me', () => {
        return HttpResponse.json({
          success: true,
          data: { user: mockUser },
        });
      })
    );

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle invalid token on mount', async () => {
    mockLocalStorage.getItem.mockReturnValue('invalid-token');

    server.use(
      http.get('*/auth/me', () => {
        return HttpResponse.json(
          { success: false, message: 'Invalid token' },
          { status: 401 }
        );
      })
    );

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
  });

  it('should handle network errors gracefully', async () => {
    server.use(
      http.post('*/auth/login', () => {
        return HttpResponse.error();
      })
    );

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.login('test@example.com', 'password123');
      } catch (error) {
        expect(error.message).toContain('Network error');
      }
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should remember user preference', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      result.current.setRememberMe(true);
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('rememberMe', 'true');
  });

  it('should clear remember me preference on logout', async () => {
    const { result } = renderHook(() => useAuth());

    server.use(
      http.post('*/auth/logout', () => {
        return HttpResponse.json({ success: true });
      })
    );

    await act(async () => {
      await result.current.logout();
    });

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('rememberMe');
  });

  it('should handle concurrent login attempts', async () => {
    const mockUser = createMockUser();
    let requestCount = 0;

    server.use(
      http.post('*/auth/login', () => {
        requestCount++;
        return HttpResponse.json({
          success: true,
          data: {
            user: mockUser,
            token: `mock-token-${requestCount}`,
            refreshToken: 'mock-refresh-token',
          },
        });
      })
    );

    const { result } = renderHook(() => useAuth());

    // Start multiple login attempts simultaneously
    const promises = [
      result.current.login('test@example.com', 'password123'),
      result.current.login('test@example.com', 'password123'),
      result.current.login('test@example.com', 'password123'),
    ];

    await act(async () => {
      await Promise.all(promises);
    });

    // Should only make one request
    expect(requestCount).toBe(1);
    expect(result.current.isAuthenticated).toBe(true);
  });
});
