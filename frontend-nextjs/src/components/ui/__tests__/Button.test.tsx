// Unit tests for Button component
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test/utils/testUtils';
import Button from '../Button';

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    const { user } = render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies primary variant styles', () => {
    render(<Button variant="primary">Primary Button</Button>);
    
    const button = screen.getByRole('button', { name: /primary button/i });
    expect(button).toHaveClass('bg-blue-600'); // Assuming primary uses blue
  });

  it('applies secondary variant styles', () => {
    render(<Button variant="secondary">Secondary Button</Button>);
    
    const button = screen.getByRole('button', { name: /secondary button/i });
    expect(button).toHaveClass('bg-gray-600'); // Assuming secondary uses gray
  });

  it('applies danger variant styles', () => {
    render(<Button variant="danger">Delete</Button>);
    
    const button = screen.getByRole('button', { name: /delete/i });
    expect(button).toHaveClass('bg-red-600'); // Assuming danger uses red
  });

  it('applies small size styles', () => {
    render(<Button size="sm">Small Button</Button>);
    
    const button = screen.getByRole('button', { name: /small button/i });
    expect(button).toHaveClass('px-3', 'py-1', 'text-sm');
  });

  it('applies large size styles', () => {
    render(<Button size="lg">Large Button</Button>);
    
    const button = screen.getByRole('button', { name: /large button/i });
    expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
  });

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    
    const button = screen.getByRole('button', { name: /disabled button/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('shows loading state', () => {
    render(<Button loading>Loading Button</Button>);
    
    const button = screen.getByRole('button', { name: /loading button/i });
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Loading...');
  });

  it('prevents click when loading', async () => {
    const handleClick = vi.fn();
    const { user } = render(
      <Button loading onClick={handleClick}>
        Loading Button
      </Button>
    );
    
    const button = screen.getByRole('button', { name: /loading button/i });
    await user.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>);
    
    const button = screen.getByRole('button', { name: /custom button/i });
    expect(button).toHaveClass('custom-class');
  });

  it('renders as submit button when type is submit', () => {
    render(<Button type="submit">Submit</Button>);
    
    const button = screen.getByRole('button', { name: /submit/i });
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('renders with icon', () => {
    const Icon = () => <span data-testid="icon">🔥</span>;
    render(
      <Button>
        <Icon />
        Button with Icon
      </Button>
    );
    
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveTextContent('Button with Icon');
  });

  it('handles keyboard navigation', async () => {
    const handleClick = vi.fn();
    const { user } = render(<Button onClick={handleClick}>Keyboard Button</Button>);
    
    const button = screen.getByRole('button', { name: /keyboard button/i });
    button.focus();
    
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('has proper accessibility attributes', () => {
    render(
      <Button aria-label="Accessible button" aria-describedby="help-text">
        Button
      </Button>
    );
    
    const button = screen.getByRole('button', { name: /accessible button/i });
    expect(button).toHaveAttribute('aria-label', 'Accessible button');
    expect(button).toHaveAttribute('aria-describedby', 'help-text');
  });

  describe('Edge Cases', () => {
    it('handles empty children', () => {
      render(<Button>{''}</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('');
    });

    it('handles null children', () => {
      render(<Button>{null}</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('handles multiple children', () => {
      render(
        <Button>
          <span>First</span>
          <span>Second</span>
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('FirstSecond');
    });

    it('maintains focus after click', async () => {
      const { user } = render(<Button>Focus Test</Button>);
      
      const button = screen.getByRole('button', { name: /focus test/i });
      await user.click(button);
      
      expect(button).toHaveFocus();
    });
  });
});
