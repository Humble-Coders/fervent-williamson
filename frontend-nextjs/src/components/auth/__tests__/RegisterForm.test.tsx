import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render, mockApiResponse, mockApiError } from '../../../test/utils/testUtils';
import RegisterForm from '../RegisterForm';
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

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders registration form with all required fields', () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields', async () => {
    const { user } = render(<RegisterForm />);

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const { user } = render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });
  });

  it('validates phone number format', async () => {
    const { user } = render(<RegisterForm />);

    const phoneInput = screen.getByLabelText(/phone/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(phoneInput, '123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid phone number/i)).toBeInTheDocument();
    });
  });

  it('validates password strength', async () => {
    const { user } = render(<RegisterForm />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(passwordInput, '123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('validates password confirmation match', async () => {
    const { user } = render(<RegisterForm />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'different123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('shows password strength indicator', async () => {
    const { user } = render(<RegisterForm />);

    const passwordInput = screen.getByLabelText(/^password$/i);

    // Weak password
    await user.type(passwordInput, '123');
    expect(screen.getByText(/weak/i)).toBeInTheDocument();

    // Medium password
    await user.clear(passwordInput);
    await user.type(passwordInput, 'password123');
    expect(screen.getByText(/medium/i)).toBeInTheDocument();

    // Strong password
    await user.clear(passwordInput);
    await user.type(passwordInput, 'Password123!');
    expect(screen.getByText(/strong/i)).toBeInTheDocument();
  });

  it('requires terms and conditions acceptance', async () => {
    const { user } = render(<RegisterForm />);

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/you must accept the terms and conditions/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const { user } = render(<RegisterForm />);

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const phoneInput = screen.getByLabelText(/phone/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const termsCheckbox = screen.getByLabelText(/terms and conditions/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(phoneInput, '+1234567890');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(termsCheckbox);
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/verify-email');
    });
  });

  it('shows loading state during submission', async () => {
    const { user } = render(<RegisterForm />);

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const termsCheckbox = screen.getByLabelText(/terms and conditions/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(termsCheckbox);
    await user.click(submitButton);

    expect(screen.getByText(/creating account/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('handles registration error gracefully', async () => {
    server.use(
      http.post('*/auth/register', () => {
        return HttpResponse.json(
          mockApiError('Email already exists'),
          { status: 400 }
        );
      })
    );

    const { user } = render(<RegisterForm />);

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const termsCheckbox = screen.getByLabelText(/terms and conditions/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'existing@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(termsCheckbox);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });

    expect(submitButton).toBeEnabled();
  });

  it('toggles password visibility for both password fields', async () => {
    const { user } = render(<RegisterForm />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const passwordToggle = screen.getAllByRole('button', { name: /toggle password visibility/i })[0];
    const confirmPasswordToggle = screen.getAllByRole('button', { name: /toggle password visibility/i })[1];

    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');

    await user.click(passwordToggle);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(confirmPasswordToggle);
    expect(confirmPasswordInput).toHaveAttribute('type', 'text');
  });

  it('navigates to login page when clicking sign in link', async () => {
    const { user } = render(<RegisterForm />);

    const signInLink = screen.getByText(/sign in/i);
    await user.click(signInLink);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('handles network error gracefully', async () => {
    server.use(
      http.post('*/auth/register', () => {
        return HttpResponse.error();
      })
    );

    const { user } = render(<RegisterForm />);

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const termsCheckbox = screen.getByLabelText(/terms and conditions/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(termsCheckbox);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('supports role selection for salon owners', async () => {
    const { user } = render(<RegisterForm />);

    const roleSelect = screen.getByLabelText(/register as/i);
    
    expect(screen.getByDisplayValue(/customer/i)).toBeInTheDocument();
    
    await user.selectOptions(roleSelect, 'SALON_OWNER');
    expect(screen.getByDisplayValue(/salon owner/i)).toBeInTheDocument();
    
    // Should show additional fields for salon owners
    expect(screen.getByLabelText(/business name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/business address/i)).toBeInTheDocument();
  });

  it('validates business information for salon owners', async () => {
    const { user } = render(<RegisterForm />);

    const roleSelect = screen.getByLabelText(/register as/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.selectOptions(roleSelect, 'SALON_OWNER');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/business name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/business address is required/i)).toBeInTheDocument();
    });
  });

  it('clears error message when user starts typing', async () => {
    server.use(
      http.post('*/auth/register', () => {
        return HttpResponse.json(
          mockApiError('Email already exists'),
          { status: 400 }
        );
      })
    );

    const { user } = render(<RegisterForm />);

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const termsCheckbox = screen.getByLabelText(/terms and conditions/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Trigger error
    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'existing@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(termsCheckbox);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });

    // Clear error by typing
    await user.clear(emailInput);
    await user.type(emailInput, 'new@example.com');

    expect(screen.queryByText(/email already exists/i)).not.toBeInTheDocument();
  });

  it('supports keyboard navigation', async () => {
    const { user } = render(<RegisterForm />);

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const phoneInput = screen.getByLabelText(/phone/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    // Tab through form
    await user.tab();
    expect(nameInput).toHaveFocus();

    await user.tab();
    expect(emailInput).toHaveFocus();

    await user.tab();
    expect(phoneInput).toHaveFocus();

    await user.tab();
    expect(passwordInput).toHaveFocus();

    await user.tab();
    expect(confirmPasswordInput).toHaveFocus();
  });
});
