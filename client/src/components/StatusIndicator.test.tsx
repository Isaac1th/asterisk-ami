import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusIndicator } from './StatusIndicator';

describe('StatusIndicator', () => {
  it('should render with connected state', () => {
    render(<StatusIndicator connected={true} label="AMI Connected" />);

    expect(screen.getByText('AMI Connected')).toBeInTheDocument();
    expect(screen.getByText('AMI Connected').closest('.status-indicator')).toHaveClass('connected');
  });

  it('should render with disconnected state', () => {
    render(<StatusIndicator connected={false} label="AMI Disconnected" />);

    expect(screen.getByText('AMI Disconnected')).toBeInTheDocument();
    expect(screen.getByText('AMI Disconnected').closest('.status-indicator')).toHaveClass('disconnected');
  });

  it('should have status-dot element', () => {
    const { container } = render(<StatusIndicator connected={true} label="Test" />);

    expect(container.querySelector('.status-dot')).toBeInTheDocument();
  });
});
