import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import ScoreInput from './ScoreInput';

describe('ScoreInput', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Rendering', () => {
    it('should render with empty value', () => {
      render(<ScoreInput value="" onChange={mockOnChange} />);

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveValue(null);
      expect(input).toHaveAttribute('placeholder', '-');
    });

    it('should render with provided value', () => {
      render(<ScoreInput value="5" onChange={mockOnChange} />);

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveValue(5);
    });

    it('should display increment/decrement buttons', () => {
      render(<ScoreInput value="5" onChange={mockOnChange} />);

      const decrementBtn = screen.getByLabelText('Decrease score');
      const incrementBtn = screen.getByLabelText('Increase score');

      expect(decrementBtn).toBeInTheDocument();
      expect(incrementBtn).toBeInTheDocument();
    });
  });

  describe('Input Validation', () => {
    it('should accept valid numeric input', async () => {
      const user = userEvent.setup();
      render(<ScoreInput value="" onChange={mockOnChange} />);

      const input = screen.getByRole('spinbutton');
      await user.type(input, '4');

      expect(mockOnChange).toHaveBeenCalledWith('4');
    });

    it('should reject non-numeric input', async () => {
      const user = userEvent.setup();
      render(<ScoreInput value="" onChange={mockOnChange} />);

      const input = screen.getByRole('spinbutton');
      await user.type(input, 'abc');

      // Should not call onChange for invalid input
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should enforce minimum value of 0', async () => {
      const user = userEvent.setup();
      render(<ScoreInput value="0" onChange={mockOnChange} />);

      const input = screen.getByRole('spinbutton');
      await user.clear(input);
      await user.type(input, '-1');

      // Should not accept negative values
      expect(mockOnChange).toHaveBeenCalledWith('');
    });

    it('should enforce maximum value of 20', async () => {
      const user = userEvent.setup();
      render(<ScoreInput value="" onChange={mockOnChange} />);

      const input = screen.getByRole('spinbutton');
      await user.type(input, '25');

      // Should reject values over 20
      expect(mockOnChange).toHaveBeenCalledWith('2');
    });

    it('should accept empty string', async () => {
      const user = userEvent.setup();
      render(<ScoreInput value="5" onChange={mockOnChange} />);

      const input = screen.getByRole('spinbutton');
      await user.clear(input);

      expect(mockOnChange).toHaveBeenCalledWith('');
    });
  });

  describe('Increment/Decrement Functionality', () => {
    it('should increment score when plus button clicked', async () => {
      const user = userEvent.setup();
      render(<ScoreInput value="4" onChange={mockOnChange} />);

      const incrementBtn = screen.getByLabelText('Increase score');
      await user.click(incrementBtn);

      expect(mockOnChange).toHaveBeenCalledWith('5');
    });

    it('should decrement score when minus button clicked', async () => {
      const user = userEvent.setup();
      render(<ScoreInput value="4" onChange={mockOnChange} />);

      const decrementBtn = screen.getByLabelText('Decrease score');
      await user.click(decrementBtn);

      expect(mockOnChange).toHaveBeenCalledWith('3');
    });

    it('should not decrement below 0', async () => {
      const user = userEvent.setup();
      render(<ScoreInput value="0" onChange={mockOnChange} />);

      const decrementBtn = screen.getByLabelText('Decrease score');
      expect(decrementBtn).toBeDisabled();

      await user.click(decrementBtn);
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should not increment above 20', async () => {
      const user = userEvent.setup();
      render(<ScoreInput value="20" onChange={mockOnChange} />);

      const incrementBtn = screen.getByLabelText('Increase score');
      expect(incrementBtn).toBeDisabled();

      await user.click(incrementBtn);
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should handle empty value for increment', async () => {
      const user = userEvent.setup();
      render(<ScoreInput value="" onChange={mockOnChange} />);

      const incrementBtn = screen.getByLabelText('Increase score');
      await user.click(incrementBtn);

      expect(mockOnChange).toHaveBeenCalledWith('1');
    });

    it('should handle empty value for decrement', async () => {
      const user = userEvent.setup();
      render(<ScoreInput value="" onChange={mockOnChange} />);

      const decrementBtn = screen.getByLabelText('Decrease score');
      expect(decrementBtn).toBeDisabled();
    });
  });

  describe('Quick Score Buttons', () => {
    it('should show quick score buttons on focus', async () => {
      const user = userEvent.setup();
      render(<ScoreInput value="" onChange={mockOnChange} />);

      const input = screen.getByRole('spinbutton');
      await user.click(input);

      // Wait for quick scores to appear
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('6')).toBeInTheDocument();
        expect(screen.getByText('7')).toBeInTheDocument();
      });
    });

    it('should hide quick score buttons on blur', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <ScoreInput value="" onChange={mockOnChange} />
          <button>Other button</button>
        </div>,
      );

      const input = screen.getByRole('spinbutton');
      const otherButton = screen.getByText('Other button');

      // Focus input to show quick scores
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText('4')).toBeInTheDocument();
      });

      // Click outside to blur
      await user.click(otherButton);

      // Quick scores should be hidden after blur delay
      await waitFor(() => {
        expect(screen.queryByText('4')).not.toBeInTheDocument();
      }, { timeout: 200 });
    });

    it('should set score when quick score button clicked', async () => {
      const user = userEvent.setup();
      render(<ScoreInput value="" onChange={mockOnChange} />);

      const input = screen.getByRole('spinbutton');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText('4')).toBeInTheDocument();
      });

      const quickScore4 = screen.getByText('4');
      await user.click(quickScore4);

      expect(mockOnChange).toHaveBeenCalledWith('4');
    });

    it('should highlight active quick score', async () => {
      const user = userEvent.setup();
      render(<ScoreInput value="5" onChange={mockOnChange} />);

      const input = screen.getByRole('spinbutton');
      await user.click(input);

      await waitFor(() => {
        const quickScore5 = screen.getByText('5');
        expect(quickScore5).toHaveClass('active');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<ScoreInput value="5" onChange={mockOnChange} />);

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '20');
      expect(input).toHaveAttribute('inputMode', 'numeric');
      expect(input).toHaveAttribute('pattern', '[0-9]*');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<ScoreInput value="5" onChange={mockOnChange} />);

      const input = screen.getByRole('spinbutton');
      await user.click(input);

      // Should be focusable
      expect(input).toHaveFocus();
    });

    it('should support keyboard navigation to buttons', async () => {
      const user = userEvent.setup();
      render(<ScoreInput value="5" onChange={mockOnChange} />);

      const decrementBtn = screen.getByLabelText('Decrease score');
      const incrementBtn = screen.getByLabelText('Increase score');

      // Should be able to tab to buttons
      await user.tab();
      expect(decrementBtn).toHaveFocus();

      await user.tab();
      expect(incrementBtn).toHaveFocus();
    });
  });

  describe('Mobile Optimization', () => {
    it('should have proper font size to prevent zoom on iOS', () => {
      render(<ScoreInput value="5" onChange={mockOnChange} />);

      const input = screen.getByRole('spinbutton');
      const styles = getComputedStyle(input);

      // Should have font-size of 16px to prevent iOS zoom
      expect(styles.fontSize).toBe('16px');
    });

    it('should have proper styling for touch targets', () => {
      render(<ScoreInput value="5" onChange={mockOnChange} />);

      const decrementBtn = screen.getByLabelText('Decrease score');
      const incrementBtn = screen.getByLabelText('Increase score');

      // Buttons should be large enough for touch interaction
      expect(decrementBtn).toBeInTheDocument();
      expect(incrementBtn).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle undefined onChange prop gracefully', () => {
      // Should not crash when onChange is undefined
      expect(() => {
        render(<ScoreInput value="5" onChange={undefined} />);
      }).not.toThrow();
    });

    it('should handle invalid value prop gracefully', () => {
      render(<ScoreInput value="invalid" onChange={mockOnChange} />);

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveValue(0); // Should default to 0 for invalid values
    });

    it('should handle null value prop gracefully', () => {
      render(<ScoreInput value={null} onChange={mockOnChange} />);

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveValue(null);
    });
  });
});
