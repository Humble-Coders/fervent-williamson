import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../../../test/utils/testUtils';
import Modal from '../Modal';

describe('Modal', () => {
  it('renders modal when open', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Modal content</div>
      </Modal>
    );
    
    expect(screen.getByText('Modal content')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render modal when closed', () => {
    render(
      <Modal isOpen={false} onClose={() => {}}>
        <div>Modal content</div>
      </Modal>
    );
    
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const handleClose = vi.fn();
    const { user } = render(
      <Modal isOpen={true} onClose={handleClose}>
        <div>Modal content</div>
      </Modal>
    );
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', async () => {
    const handleClose = vi.fn();
    const { user } = render(
      <Modal isOpen={true} onClose={handleClose}>
        <div>Modal content</div>
      </Modal>
    );
    
    const overlay = screen.getByTestId('modal-overlay');
    await user.click(overlay);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when modal content is clicked', async () => {
    const handleClose = vi.fn();
    const { user } = render(
      <Modal isOpen={true} onClose={handleClose}>
        <div>Modal content</div>
      </Modal>
    );
    
    const content = screen.getByText('Modal content');
    await user.click(content);
    
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('closes when Escape key is pressed', async () => {
    const handleClose = vi.fn();
    const { user } = render(
      <Modal isOpen={true} onClose={handleClose}>
        <div>Modal content</div>
      </Modal>
    );
    
    await user.keyboard('{Escape}');
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not close on Escape when closeOnEscape is false', async () => {
    const handleClose = vi.fn();
    const { user } = render(
      <Modal isOpen={true} onClose={handleClose} closeOnEscape={false}>
        <div>Modal content</div>
      </Modal>
    );
    
    await user.keyboard('{Escape}');
    
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('does not close on overlay click when closeOnOverlayClick is false', async () => {
    const handleClose = vi.fn();
    const { user } = render(
      <Modal isOpen={true} onClose={handleClose} closeOnOverlayClick={false}>
        <div>Modal content</div>
      </Modal>
    );
    
    const overlay = screen.getByTestId('modal-overlay');
    await user.click(overlay);
    
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('renders modal with title', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Modal Title">
        <div>Modal content</div>
      </Modal>
    );
    
    expect(screen.getByText('Modal Title')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby');
  });

  it('renders modal with description', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} description="Modal description">
        <div>Modal content</div>
      </Modal>
    );
    
    expect(screen.getByText('Modal description')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby');
  });

  it('applies different sizes', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}} size="sm">
        <div>Small modal</div>
      </Modal>
    );
    
    let modal = screen.getByRole('dialog');
    expect(modal).toHaveClass('max-w-sm');
    
    rerender(
      <Modal isOpen={true} onClose={() => {}} size="md">
        <div>Medium modal</div>
      </Modal>
    );
    
    modal = screen.getByRole('dialog');
    expect(modal).toHaveClass('max-w-md');
    
    rerender(
      <Modal isOpen={true} onClose={() => {}} size="lg">
        <div>Large modal</div>
      </Modal>
    );
    
    modal = screen.getByRole('dialog');
    expect(modal).toHaveClass('max-w-lg');
  });

  it('traps focus within modal', async () => {
    const { user } = render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>
          <button>First button</button>
          <button>Second button</button>
        </div>
      </Modal>
    );
    
    const firstButton = screen.getByText('First button');
    const secondButton = screen.getByText('Second button');
    const closeButton = screen.getByRole('button', { name: /close/i });
    
    // Focus should start on the first focusable element
    expect(firstButton).toHaveFocus();
    
    // Tab should move to next element
    await user.tab();
    expect(secondButton).toHaveFocus();
    
    // Tab should move to close button
    await user.tab();
    expect(closeButton).toHaveFocus();
    
    // Tab should wrap back to first element
    await user.tab();
    expect(firstButton).toHaveFocus();
  });

  it('restores focus to trigger element when closed', async () => {
    const { user } = render(
      <div>
        <button>Trigger button</button>
        <Modal isOpen={true} onClose={() => {}}>
          <div>Modal content</div>
        </Modal>
      </div>
    );
    
    const triggerButton = screen.getByText('Trigger button');
    triggerButton.focus();
    
    // Close modal
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    
    // Focus should return to trigger button
    expect(triggerButton).toHaveFocus();
  });

  it('prevents body scroll when open', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Modal content</div>
      </Modal>
    );
    
    expect(document.body).toHaveStyle('overflow: hidden');
  });

  it('restores body scroll when closed', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Modal content</div>
      </Modal>
    );
    
    expect(document.body).toHaveStyle('overflow: hidden');
    
    rerender(
      <Modal isOpen={false} onClose={() => {}}>
        <div>Modal content</div>
      </Modal>
    );
    
    expect(document.body).not.toHaveStyle('overflow: hidden');
  });

  it('renders with custom className', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} className="custom-modal">
        <div>Modal content</div>
      </Modal>
    );
    
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveClass('custom-modal');
  });

  it('renders with custom overlay className', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} overlayClassName="custom-overlay">
        <div>Modal content</div>
      </Modal>
    );
    
    const overlay = screen.getByTestId('modal-overlay');
    expect(overlay).toHaveClass('custom-overlay');
  });

  it('supports fullscreen mode', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} fullscreen>
        <div>Fullscreen modal</div>
      </Modal>
    );
    
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveClass('w-full', 'h-full');
  });

  it('hides close button when showCloseButton is false', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} showCloseButton={false}>
        <div>Modal content</div>
      </Modal>
    );
    
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
  });

  it('renders with footer', () => {
    const footer = (
      <div>
        <button>Cancel</button>
        <button>Save</button>
      </div>
    );
    
    render(
      <Modal isOpen={true} onClose={() => {}} footer={footer}>
        <div>Modal content</div>
      </Modal>
    );
    
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('animates in and out', async () => {
    const { rerender } = render(
      <Modal isOpen={false} onClose={() => {}}>
        <div>Modal content</div>
      </Modal>
    );
    
    // Open modal
    rerender(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Modal content</div>
      </Modal>
    );
    
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveClass('animate-in');
    
    // Close modal
    rerender(
      <Modal isOpen={false} onClose={() => {}}>
        <div>Modal content</div>
      </Modal>
    );
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('supports portal rendering', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} portal>
        <div>Portal modal</div>
      </Modal>
    );
    
    // Modal should be rendered in document.body
    expect(document.body).toContainElement(screen.getByRole('dialog'));
  });

  it('handles multiple modals with z-index stacking', () => {
    render(
      <div>
        <Modal isOpen={true} onClose={() => {}} zIndex={1000}>
          <div>First modal</div>
        </Modal>
        <Modal isOpen={true} onClose={() => {}} zIndex={1010}>
          <div>Second modal</div>
        </Modal>
      </div>
    );
    
    const modals = screen.getAllByRole('dialog');
    expect(modals[0]).toHaveStyle('z-index: 1000');
    expect(modals[1]).toHaveStyle('z-index: 1010');
  });

  it('supports custom aria attributes', () => {
    render(
      <Modal 
        isOpen={true} 
        onClose={() => {}}
        aria-label="Custom modal"
        aria-describedby="custom-description"
      >
        <div id="custom-description">Custom description</div>
      </Modal>
    );
    
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-label', 'Custom modal');
    expect(modal).toHaveAttribute('aria-describedby', 'custom-description');
  });

  it('calls onOpen callback when modal opens', () => {
    const handleOpen = vi.fn();
    const { rerender } = render(
      <Modal isOpen={false} onClose={() => {}} onOpen={handleOpen}>
        <div>Modal content</div>
      </Modal>
    );
    
    rerender(
      <Modal isOpen={true} onClose={() => {}} onOpen={handleOpen}>
        <div>Modal content</div>
      </Modal>
    );
    
    expect(handleOpen).toHaveBeenCalledTimes(1);
  });

  it('handles loading state', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} loading>
        <div>Modal content</div>
      </Modal>
    );
    
    expect(screen.getByTestId('modal-loading')).toBeInTheDocument();
  });
});
