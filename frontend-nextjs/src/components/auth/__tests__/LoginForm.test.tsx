import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render, createMockUser, mockApiResponse, mockApiError } from '../../../test/utils/testUtils';
import LoginForm from '../LoginForm';
import { server } from '../../../test/mocks/server';
import { http, HttpResponse } from 'msw';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form with all required fields', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    const { user } = render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email format', async () => {
    const { user } = render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    const { user } = render(<LoginForm />);

    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(passwordInput, '123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid credentials', async () => {
    const { user } = render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows loading state during submission', async () => {
    const { user } = render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('handles login error gracefully', async () => {
    server.use(
      http.post('*/auth/login', () => {
        return HttpResponse.json(
          mockApiError('Invalid credentials'),
          { status: 401 }
        );
      })
    );

    const { user } = render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });

    expect(submitButton).toBeEnabled();
  });

  it('toggles password visibility', async () => {
    const { user } = render(<LoginForm />);

    const passwordInput = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('navigates to register page when clicking sign up link', async () => {
    const { user } = render(<LoginForm />);

    const signUpLink = screen.getByText(/sign up/i);
    await user.click(signUpLink);

    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });

  it('navigates to forgot password page when clicking forgot password link', async () => {
    const { user } = render(<LoginForm />);

    const forgotPasswordLink = screen.getByText(/forgot password/i);
    await user.click(forgotPasswordLink);

    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
  });

  it('remembers user preference for "Remember me" checkbox', async () => {
    const { user } = render(<LoginForm />);

    const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
    
    expect(rememberMeCheckbox).not.toBeChecked();
    
    await user.click(rememberMeCheckbox);
    expect(rememberMeCheckbox).toBeChecked();
  });

  it('handles network error gracefully', async () => {
    server.use(
      http.post('*/auth/login', () => {
        return HttpResponse.error();
      })
    );

    const { user } = render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('clears error message when user starts typing', async () => {
    server.use(
      http.post('*/auth/login', () => {
        return HttpResponse.json(
          mockApiError('Invalid credentials'),
          { status: 401 }
        );
      })
    );

    const { user } = render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Trigger error
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });

    // Clear error by typing
    await user.clear(emailInput);
    await user.type(emailInput, 'new@example.com');

    expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument();
  });

  it('supports keyboard navigation', async () => {
    const { user } = render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Tab through form
    await user.tab();
    expect(emailInput).toHaveFocus();

    await user.tab();
    expect(passwordInput).toHaveFocus();

    await user.tab();
    expect(screen.getByLabelText(/remember me/i)).toHaveFocus();

    await user.tab();
    expect(submitButton).toHaveFocus();

    // Submit with Enter key
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles successful login with different user roles', async () => {
    const adminUser = createMockUser({ role: 'ADMIN' });
    
    server.use(
      http.post('*/auth/login', () => {
        return HttpResponse.json(
          mockApiResponse({
            user: adminUser,
            token: 'mock-token',
            refreshToken: 'mock-refresh-token',
          })
        );
      })
    );

    const { user } = render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'admin@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  it('redirects to intended page after login', async () => {
    const { user } = render(<LoginForm />, {
      initialEntries: ['/login?redirect=/bookings'],
    });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/bookings');
    });
  });
});
