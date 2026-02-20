import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../../../test/utils/testUtils';
import Input from '../Input';

describe('Input', () => {
  it('renders input with label', () => {
    render(<Input label="Email" />);
    
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders input without label', () => {
    render(<Input placeholder="Enter text" />);
    
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('handles value changes', async () => {
    const handleChange = vi.fn();
    const { user } = render(<Input label="Name" onChange={handleChange} />);
    
    const input = screen.getByLabelText('Name');
    await user.type(input, 'John Doe');
    
    expect(handleChange).toHaveBeenCalledTimes(8); // One for each character
    expect(input).toHaveValue('John Doe');
  });

  it('shows error state and message', () => {
    render(<Input label="Email" error="Invalid email format" />);
    
    const input = screen.getByLabelText('Email');
    expect(input).toHaveClass('border-red-500');
    expect(screen.getByText('Invalid email format')).toBeInTheDocument();
  });

  it('shows required indicator', () => {
    render(<Input label="Password" required />);
    
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('shows help text', () => {
    render(<Input label="Password" helpText="Must be at least 8 characters" />);
    
    expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
  });

  it('applies disabled state', () => {
    render(<Input label="Disabled" disabled />);
    
    const input = screen.getByLabelText('Disabled');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('renders different input types', () => {
    const { rerender } = render(<Input type="email" data-testid="email-input" />);
    expect(screen.getByTestId('email-input')).toHaveAttribute('type', 'email');
    
    rerender(<Input type="password" data-testid="password-input" />);
    expect(screen.getByTestId('password-input')).toHaveAttribute('type', 'password');
    
    rerender(<Input type="number" data-testid="number-input" />);
    expect(screen.getByTestId('number-input')).toHaveAttribute('type', 'number');
  });

  it('renders with icon', () => {
    const Icon = () => <span data-testid="icon">🔍</span>;
    render(<Input label="Search" icon={<Icon />} />);
    
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders with right icon', () => {
    const Icon = () => <span data-testid="right-icon">✓</span>;
    render(<Input label="Valid" rightIcon={<Icon />} />);
    
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('applies different sizes', () => {
    const { rerender } = render(<Input size="sm" data-testid="small-input" />);
    expect(screen.getByTestId('small-input')).toHaveClass('px-3', 'py-1.5', 'text-sm');
    
    rerender(<Input size="md" data-testid="medium-input" />);
    expect(screen.getByTestId('medium-input')).toHaveClass('px-4', 'py-2', 'text-base');
    
    rerender(<Input size="lg" data-testid="large-input" />);
    expect(screen.getByTestId('large-input')).toHaveClass('px-4', 'py-3', 'text-lg');
  });

  it('supports controlled input', async () => {
    const handleChange = vi.fn();
    const { user, rerender } = render(
      <Input label="Controlled" value="initial" onChange={handleChange} />
    );
    
    const input = screen.getByLabelText('Controlled');
    expect(input).toHaveValue('initial');
    
    await user.clear(input);
    await user.type(input, 'new value');
    
    // Rerender with new value
    rerender(<Input label="Controlled" value="new value" onChange={handleChange} />);
    expect(input).toHaveValue('new value');
  });

  it('supports uncontrolled input with defaultValue', () => {
    render(<Input label="Uncontrolled" defaultValue="default text" />);
    
    const input = screen.getByLabelText('Uncontrolled');
    expect(input).toHaveValue('default text');
  });

  it('handles focus and blur events', async () => {
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();
    const { user } = render(
      <Input label="Focus Test" onFocus={handleFocus} onBlur={handleBlur} />
    );
    
    const input = screen.getByLabelText('Focus Test');
    
    await user.click(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);
    
    await user.tab();
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('supports keyboard navigation', async () => {
    const { user } = render(<Input label="Keyboard Test" />);
    
    const input = screen.getByLabelText('Keyboard Test');
    
    await user.tab();
    expect(input).toHaveFocus();
    
    await user.keyboard('Hello');
    expect(input).toHaveValue('Hello');
  });

  it('applies custom className', () => {
    render(<Input label="Custom" className="custom-class" />);
    
    const input = screen.getByLabelText('Custom');
    expect(input).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Input label="Ref Test" ref={ref} />);
    
    expect(ref).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(<Input label="Loading" loading />);
    
    expect(screen.getByTestId('input-loading')).toBeInTheDocument();
  });

  it('supports autoComplete attribute', () => {
    render(<Input label="Email" autoComplete="email" />);
    
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('autocomplete', 'email');
  });

  it('supports maxLength attribute', async () => {
    const { user } = render(<Input label="Short" maxLength={5} />);
    
    const input = screen.getByLabelText('Short');
    await user.type(input, '1234567890');
    
    expect(input).toHaveValue('12345');
  });

  it('supports pattern attribute', () => {
    render(<Input label="Pattern" pattern="[0-9]*" />);
    
    const input = screen.getByLabelText('Pattern');
    expect(input).toHaveAttribute('pattern', '[0-9]*');
  });

  it('shows character count when maxLength is provided', async () => {
    const { user } = render(<Input label="Limited" maxLength={10} showCharCount />);
    
    const input = screen.getByLabelText('Limited');
    await user.type(input, 'Hello');
    
    expect(screen.getByText('5/10')).toBeInTheDocument();
  });

  it('applies correct ARIA attributes', () => {
    render(
      <Input 
        label="ARIA Test"
        error="Error message"
        helpText="Help text"
        required
        aria-describedby="custom-description"
      />
    );
    
    const input = screen.getByLabelText('ARIA Test *');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAttribute('aria-describedby');
  });

  it('handles paste events', async () => {
    const handlePaste = vi.fn();
    const { user } = render(<Input label="Paste Test" onPaste={handlePaste} />);
    
    const input = screen.getByLabelText('Paste Test');
    await user.click(input);
    await user.paste('pasted text');
    
    expect(handlePaste).toHaveBeenCalled();
    expect(input).toHaveValue('pasted text');
  });

  it('supports readonly state', () => {
    render(<Input label="Readonly" readOnly value="readonly value" />);
    
    const input = screen.getByLabelText('Readonly');
    expect(input).toHaveAttribute('readonly');
    expect(input).toHaveValue('readonly value');
  });

  it('handles input validation', async () => {
    const { user } = render(<Input label="Email" type="email" required />);
    
    const input = screen.getByLabelText('Email *');
    await user.type(input, 'invalid-email');
    await user.tab(); // Trigger validation
    
    expect(input).toHaveAttribute('aria-invalid');
  });

  it('supports step attribute for number inputs', () => {
    render(<Input label="Number" type="number" step="0.01" />);
    
    const input = screen.getByLabelText('Number');
    expect(input).toHaveAttribute('step', '0.01');
  });

  it('supports min and max attributes for number inputs', () => {
    render(<Input label="Range" type="number" min="0" max="100" />);
    
    const input = screen.getByLabelText('Range');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '100');
  });

  it('clears input when clear button is clicked', async () => {
    const handleChange = vi.fn();
    const { user } = render(
      <Input label="Clearable" value="some text" onChange={handleChange} clearable />
    );
    
    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);
    
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({ target: { value: '' } })
    );
  });
});
